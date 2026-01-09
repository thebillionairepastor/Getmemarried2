// screens/UserDashboard.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import NewsFlashBar from "../components/NewsFlashBar";
import { auth, db } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";
import {
  doc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { assignGuardianAutomatically } from "../firebase/matchingLogic"; // ✅ You must create this file

export default function UserDashboard() {
  const user = auth.currentUser;
  const navigation = useNavigation();
  const [status, setStatus] = useState("Loading...");
  const [referralCode, setReferralCode] = useState("...");

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate("Login");
  };

  const fetchUserData = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setReferralCode(userSnap.data().referralCode || "N/A");
      }

      const q = query(
        collection(db, "verifications"),
        where("userId", "==", user.uid),
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        setStatus(latest.status || "Pending");
      } else {
        setStatus("Not requested");
      }
    } catch (error) {
      setStatus("Error fetching status");
    }
  };

  const handleRequestVerification = async () => {
    try {
      const q = query(
        collection(db, "verifications"),
        where("userId", "==", user.uid),
        where("status", "in", ["pending", "assigned"]),
      );
      const existingReq = await getDocs(q);

      if (!existingReq.empty) {
        Alert.alert("Already Requested", "You already have a pending request.");
        return;
      }

      const guardianId = await assignGuardianAutomatically(user.uid);

      if (!guardianId) {
        Alert.alert("No Guardian Found", "Please try again later.");
        return;
      }

      await addDoc(collection(db, "verifications"), {
        userId: user.uid,
        assignedGuardian: guardianId,
        status: "pending",
        requestedAt: new Date(),
      });

      Alert.alert("Request Sent", "Guardian has been assigned.");
      fetchUserData();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <NewsFlashBar />
      <Text style={styles.title}>👤 User Dashboard</Text>
      <Text style={styles.label}>Welcome, {user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Verification Status:</Text>
        <Text style={styles.cardValue}>{status}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Referral Code:</Text>
        <Text style={styles.cardValue}>{referralCode}</Text>
      </View>

      <View style={styles.section}>
        <Button
          title="Request Verification"
          onPress={handleRequestVerification}
          color="#6A0DAD"
        />
      </View>

      <View style={styles.section}>
        <Button
          title="💕 View Matches"
          onPress={() => navigation.navigate("MatchesScreen")}
          color="#E91E63"
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
