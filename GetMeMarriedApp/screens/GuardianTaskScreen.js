// screens/GuardianTaskScreen.js

import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert, FlatList } from "react-native";
import { auth, db } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function GuardianTaskScreen() {
  const [tasks, setTasks] = useState([]);
  const guardianId = auth.currentUser?.uid;

  const loadTasks = async () => {
    const q = query(
      collection(db, "verifications"),
      where("assignedGuardian", "==", guardianId),
      where("status", "==", "pending"),
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTasks(data);
  };

  const handleApprove = async (taskId) => {
    const ref = doc(db, "verifications", taskId);
    await updateDoc(ref, {
      status: "verified",
      verifiedAt: new Date(),
    });
    Alert.alert("✅ Verified", "Verification submitted to admin.");
    loadTasks();
  };

  const handleReject = async (taskId) => {
    const ref = doc(db, "verifications", taskId);
    await updateDoc(ref, {
      status: "rejected",
      rejectedAt: new Date(),
    });
    Alert.alert("❌ Rejected", "You have rejected this user.");
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.text}>👤 User ID: {item.userId}</Text>
      <Text>Status: {item.status}</Text>

      <View style={styles.buttonRow}>
        <Button
          title="✅ Approve"
          onPress={() => handleApprove(item.id)}
          color="#4CAF50"
        />
        <Button
          title="❌ Reject"
          onPress={() => handleReject(item.id)}
          color="#F44336"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Assigned Verifications</Text>

      {tasks.length === 0 ? (
        <Text style={styles.text}>No pending tasks 🎉</Text>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  taskCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  text: { fontSize: 16, marginBottom: 6 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
