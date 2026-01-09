// screens/VerificationApprovalScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendPushNotification } from "../utils/sendPushNotification";

export default function VerificationApprovalScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      const q = query(
        collection(db, "verifications"),
        where("status", "==", "pending"),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      // Update verification status
      await updateDoc(doc(db, "verifications", userId), {
        status: "verified",
        verifiedAt: new Date(),
      });

      // Get user pushToken
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (userData?.pushToken) {
        await sendPushNotification(
          userData.pushToken,
          "✅ Verification Approved",
          "Congratulations! Your profile has been verified.",
        );
      }

      Alert.alert("Success", "Verification approved.");
      loadPendingVerifications(); // Refresh list
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text>User ID: {item.userId}</Text>
      <Text>Status: {item.status}</Text>
      <Button
        title="✅ Approve"
        onPress={() => handleApprove(item.userId)}
        color="#6A0DAD"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗂️ Pending Verifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6A0DAD" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
});
