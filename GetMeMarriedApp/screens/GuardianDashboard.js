// screens/GuardianDashboard.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { auth, db } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function GuardianDashboard() {
  const user = auth.currentUser;
  const navigation = useNavigation();
  const [verifications, setVerifications] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [badge, setBadge] = useState("");

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate("Login");
  };

  const handlePayoutRequest = async () => {
    try {
      await addDoc(collection(db, "payoutRequests"), {
        guardianId: user.uid,
        amount: earnings,
        requestedAt: Timestamp.now(),
        status: "pending",
      });
      Alert.alert("Request Sent", "Admin will review your payout soon.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const checkAndAssignBadge = async (verifiedCount) => {
    let badgeToAssign = "";

    // 💙 5+ verifications
    if (verifiedCount >= 5) badgeToAssign = "💙";

    // 💚 10+ verifications + secondary verification flag
    const guardianRef = doc(db, "guardians", user.uid);
    const docSnap = await getDocs(
      query(collection(db, "guardians"), where("id", "==", user.uid)),
    );

    const guardianData = docSnap.docs[0]?.data();
    const hasSecondary = guardianData?.secondaryVerified === true;

    if (verifiedCount >= 10 && hasSecondary) badgeToAssign = "💚";

    // Save badge to Firestore
    await updateDoc(guardianRef, { badge: badgeToAssign });
    setBadge(badgeToAssign);
  };

  const loadVerifications = async () => {
    const q = query(
      collection(db, "verifications"),
      where("assignedGuardian", "==", user.uid),
    );
    const snapshot = await getDocs(q);
    const completed = snapshot.docs.filter(
      (doc) => doc.data().status === "verified",
    );
    setVerifications(snapshot.docs.map((doc) => doc.data()));
    setEarnings(completed.length * 100);

    await checkAndAssignBadge(completed.length);
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛡️ Guardian Dashboard {badge}</Text>
      <Text style={styles.label}>Email: {user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Verifications:</Text>
        <Text style={styles.cardValue}>{verifications.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Earnings:</Text>
        <Text style={styles.cardValue}>₦{earnings}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Badge:</Text>
        <Text style={styles.cardValue}>{badge || "None"}</Text>
      </View>

      <View style={styles.section}>
        <Button
          title="Request Payout"
          onPress={handlePayoutRequest}
          color="#4CAF50"
        />
      </View>

      <View style={styles.section}>
        <Button title="Logout" onPress={handleLogout} color="#D32F2F" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardValue: {
    fontSize: 18,
    color: "#333",
    marginTop: 8,
  },
  section: {
    marginTop: 20,
  },
});
