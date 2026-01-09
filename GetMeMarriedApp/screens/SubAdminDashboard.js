
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigation } from "@react-navigation/native";

export default function SubAdminDashboard() {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    activeMatches: 0,
  });
  const navigation = useNavigation();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load pending verifications
      const verificationsRef = collection(db, "verifications");
      const q = query(verificationsRef, where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      setPendingVerifications(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Load stats
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => doc.data());
      const verified = users.filter(u => u.verified).length;

      const matchesSnapshot = await getDocs(
        query(collection(db, "matches"), where("status", "==", "active"))
      );

      setStats({
        totalUsers: users.length,
        verifiedUsers: verified,
        activeMatches: matchesSnapshot.size,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👑 SubAdmin Dashboard</Text>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.verifiedUsers}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeMatches}</Text>
          <Text style={styles.statLabel}>Active Matches</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("VerificationApproval")}
      >
        <Text style={styles.buttonText}>
          📋 Review Verifications ({pendingVerifications.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("GuardianMetricsScreen")}
      >
        <Text style={styles.buttonText}>📊 Guardian Performance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6A0DAD",
    textAlign: "center",
    marginBottom: 24,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6A0DAD",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: "#6A0DAD",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
