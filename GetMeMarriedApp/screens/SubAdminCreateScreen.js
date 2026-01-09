// screens/SubAdminCreateScreen.js

import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function SubAdminCreateScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleCreate = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("All fields are required");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name: fullName,
        email,
        accountType: "sub-admin",
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
      });

      Alert.alert("Sub Admin created successfully!");
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error) {
      Alert.alert("Error creating Sub Admin", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Sub Admin</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Temporary Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Create Sub Admin" onPress={handleCreate} color="#6A0DAD" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
    color: "#6A0DAD",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
});
