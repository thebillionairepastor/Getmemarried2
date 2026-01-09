// screens/AdminDashboard.js

import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { auth } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";
import { autoMatchUsers } from "../firebase/matchUsers";

export default function AdminDashboard() {
  const user = auth.currentUser;
  const navigation = useNavigation();

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👑 Super Admin Dashboard</Text>
      <Text style={styles.label}>Logged in as: {user?.email}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Users:</Text>
        <Text style={styles.cardValue}>0 (sample)</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Verifications:</Text>
        <Text style={styles.cardValue}>0 (sample)</Text>
      </View>
      {/* ✅ Navigate to Verification Approval */}
      <View style={styles.section}>
        <Button
          title="View Verification Requests"
          onPress={() => navigation.navigate("VerificationApproval")}
          color="#6A0DAD"
        />
      </View>
      
      <View style={styles.section}>
        <Button
          title="🔁 Run Matchmaking"
          onPress={autoMatchUsers}
          color="#009688"
        />
      </View>
      {/* 🔐 Logout */}
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
