// screens/VerificationApproval.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Button, Alert } from "react-native";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { sendPushNotification } from "../utils/sendPushNotification";
import { useNavigation } from "@react-navigation/native";

export default function VerificationApproval() {
  const [verifications, setVerifications] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const snapshot = await getDocs(collection(db, "verifications"));
      const pending = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((v) => v.status === "pending");

      setVerifications(pending);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleApproveVerification = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const verificationRef = doc(db, "verifications", userId);
      await updateDoc(verificationRef, {
        status: "verified",
        verifiedAt: new Date(),
      });

      if (userData?.pushToken) {
        await sendPushNotification(
          userData.pushToken,
          "✅ You're Verified!",
          "Congratulations! Your profile has been verified.",
        );
      }

      Alert.alert("✅ Success", "User verified and notified!");
      loadVerifications(); // Refresh list
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.text}>👤 User ID: {item.userId}</Text>
      <Text>Status: {item.status}</Text>
      <View style={styles.buttons}>
        <Button
          title="Approve"
          color="#4CAF50"
          onPress={() => handleApproveVerification(item.userId)}
        />
        <Button
          title="Reject"
          color="#D32F2F"
          onPress={() => Alert.alert("Rejected", "Feature Coming Soon")}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Pending Verifications</Text>
      <FlatList
        data={verifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Back to Admin" onPress={() => navigation.goBack()} />
      </View>
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
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});
