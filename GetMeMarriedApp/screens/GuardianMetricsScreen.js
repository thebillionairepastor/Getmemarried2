// screens/GuardianMetricsScreen.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native";
import { auth, db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function GuardianMetricsScreen() {
  const user = auth.currentUser;
  const [verifications, setVerifications] = useState([]);
  const [points, setPoints] = useState(0);
  const [avgTime, setAvgTime] = useState(0);

  const loadGuardianMetrics = async () => {
    const q = query(
      collection(db, "verifications"),
      where("assignedGuardian", "==", user.uid),
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map((doc) => doc.data());
    setVerifications(records);

    // Calculate points and average time
    let earnedPoints = 0;
    let totalHours = 0;
    let count = 0;

    for (let record of records) {
      if (record.status === "verified") {
        earnedPoints += 20; // 🎯 Award 20 pts per verification

        if (record.requestedAt && record.verifiedAt) {
          const start = record.requestedAt.toDate();
          const end = record.verifiedAt.toDate();
          const diff = (end - start) / 3600000;
          totalHours += diff;
          count++;
        }
      }
    }

    setPoints(earnedPoints);
    setAvgTime(count ? (totalHours / count).toFixed(2) : 0);
  };

  useEffect(() => {
    loadGuardianMetrics();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Guardian Metrics</Text>
      <Text style={styles.label}>Email: {user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Completed Verifications:</Text>
        <Text style={styles.cardValue}>
          {verifications.filter((v) => v.status === "verified").length}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Points Earned:</Text>
        <Text style={styles.cardValue}>{points} pts</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Average Verification Time:</Text>
        <Text style={styles.cardValue}>{avgTime} hrs</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#F8F8F8",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6A0DAD",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
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
});
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export default function GuardianMetricsScreen() {
  const [guardianMetrics, setGuardianMetrics] = useState([]);

  useEffect(() => {
    loadGuardianMetrics();
  }, []);

  const loadGuardianMetrics = async () => {
    try {
      const metricsSnapshot = await getDocs(collection(db, "guardianMetrics"));
      const metrics = metricsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by points descending
      metrics.sort((a, b) => (b.points || 0) - (a.points || 0));
      setGuardianMetrics(metrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  const renderGuardian = ({ item, index }) => (
    <View style={styles.guardianCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.guardianInfo}>
        <Text style={styles.guardianId}>{item.guardianId}</Text>
        <Text style={styles.rank}>Rank: {item.rank || "Bronze"}</Text>
        <Text style={styles.points}>Points: {item.points || 0}</Text>
        <Text style={styles.completionRate}>
          Completion Rate: {item.completionRate || 0}%
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>✅ {item.totalCompleted || 0}</Text>
          <Text style={styles.stat}>❌ {item.totalRejected || 0}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Guardian Performance</Text>
      <FlatList
        data={guardianMetrics}
        renderItem={renderGuardian}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    marginBottom: 20,
  },
  guardianCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  rankBadge: {
    backgroundColor: "#FFD700",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rankText: {
    fontWeight: "bold",
    color: "#333",
  },
  guardianInfo: {
    flex: 1,
  },
  guardianId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  rank: {
    fontSize: 14,
    color: "#6A0DAD",
    marginTop: 4,
  },
  points: {
    fontSize: 14,
    color: "#4CAF50",
    marginTop: 2,
  },
  completionRate: {
    fontSize: 14,
    color: "#FF9800",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  stat: {
    fontSize: 12,
    marginRight: 16,
    color: "#666",
  },
});
