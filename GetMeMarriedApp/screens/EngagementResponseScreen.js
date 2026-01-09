// screens/EngagementResponseScreen.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { auth, db } from "../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

export default function EngagementResponseScreen({ route }) {
  const user = auth.currentUser;
  const [engagement, setEngagement] = useState(null);
  const engagementId = route.params?.engagementId;

  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        const docRef = doc(db, "engagements", engagementId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEngagement(docSnap.data());
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    };

    fetchEngagement();
  }, []);

  const updateStatus = async (status) => {
    try {
      const docRef = doc(db, "engagements", engagementId);
      await updateDoc(docRef, {
        status,
        respondedAt: serverTimestamp(),
        responseUser: user.uid,
      });

      if (status === "accepted") {
        Alert.alert("💍 Congratulations!", "You are now engaged!");
      } else if (status === "declined") {
        Alert.alert("⛔ Declined", "You declined the engagement.");
      } else if (status === "review") {
        Alert.alert(
          "Review Mode",
          "You have 7 days to make your final decision.",
        );
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (!engagement) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💌 Engagement Proposal</Text>
      <Text style={styles.text}>
        {engagement.initiatorId} has proposed an engagement to you.
      </Text>

      <Button
        title="✅ Accept"
        onPress={() => updateStatus("accepted")}
        color="#4CAF50"
      />
      <View style={{ height: 10 }} />
      <Button
        title="⏳ Review (7 days)"
        onPress={() => updateStatus("review")}
        color="#FF9800"
      />
      <View style={{ height: 10 }} />
      <Button
        title="❌ Decline"
        onPress={() => updateStatus("declined")}
        color="#F44336"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 24,
    color: "#6A0DAD",
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    fontSize: 18,
    marginTop: 40,
  },
});
