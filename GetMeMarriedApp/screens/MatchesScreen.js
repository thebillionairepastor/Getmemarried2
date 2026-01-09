
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";

export default function MatchesScreen() {
  const [matches, setMatches] = useState([]);
  const currentUser = auth.currentUser;
  const navigation = useNavigation();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      // Find matches where current user is either userA or userB
      const matchesRef = collection(db, "matches");
      const q1 = query(matchesRef, where("userA", "==", currentUser.uid));
      const q2 = query(matchesRef, where("userB", "==", currentUser.uid));
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const allMatches = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ];

      // Get partner details for each match
      const matchesWithPartners = await Promise.all(
        allMatches.map(async (match) => {
          const partnerId = match.userA === currentUser.uid ? match.userB : match.userA;
          const partnerRef = doc(db, "users", partnerId);
          const partnerSnap = await getDoc(partnerRef);
          
          return {
            ...match,
            partnerId,
            partnerData: partnerSnap.exists() ? partnerSnap.data() : null,
          };
        })
      );

      setMatches(matchesWithPartners);
    } catch (error) {
      Alert.alert("Error", "Failed to load matches");
    }
  };

  const openChat = (match) => {
    navigation.navigate("ChatScreen", {
      matchId: match.id,
      partnerId: match.partnerId,
    });
  };

  const renderMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => openChat(item)}
    >
      <Text style={styles.partnerName}>
        {item.partnerData?.name || "Unknown User"}
      </Text>
      <Text style={styles.partnerEmail}>
        {item.partnerData?.email || ""}
      </Text>
      <Text style={styles.matchStatus}>
        Status: {item.status}
      </Text>
      <Text style={styles.chatPrompt}>Tap to chat 💬</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💕 Your Matches</Text>
      {matches.length === 0 ? (
        <Text style={styles.emptyText}>No matches yet. Keep waiting! 💫</Text>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F8F8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    marginTop: 50,
  },
  matchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  partnerEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  matchStatus: {
    fontSize: 14,
    color: "#6A0DAD",
    marginTop: 8,
  },
  chatPrompt: {
    fontSize: 14,
    color: "#009688",
    marginTop: 8,
    fontStyle: "italic",
  },
});
