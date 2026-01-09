// screens/SignupScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("user");

  // ✅ Notification Preferences
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);

  const handleSignup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const userId = userCred.user.uid;

      await setDoc(doc(db, "users", userId), {
        email,
        accountType,
        createdAt: new Date(),
        notificationPrefs: {
          push: notifyPush,
          email: notifyEmail,
          whatsapp: notifyWhatsApp,
        },
      });

      Alert.alert("Signup Successful", "Welcome to GetMeMarried!");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Account Type (User or Guardian) */}
      <Text style={styles.label}>Register as:</Text>
      <View style={styles.checkboxRow}>
        <CheckBox
          value={accountType === "user"}
          onValueChange={() => setAccountType("user")}
        />
        <Text>User</Text>

        <CheckBox
          value={accountType === "guardian"}
          onValueChange={() => setAccountType("guardian")}
        />
        <Text>Guardian</Text>
      </View>

      {/* Notification Preferences */}
      <Text style={styles.label}>Notification Preferences:</Text>

      <View style={styles.checkboxRow}>
        <Switch value={notifyPush} onValueChange={setNotifyPush} />
        <Text style={styles.checkboxLabel}>Push Notifications</Text>
      </View>

      <View style={styles.checkboxRow}>
        <Switch value={notifyEmail} onValueChange={setNotifyEmail} />
        <Text style={styles.checkboxLabel}>Email Notifications</Text>
      </View>

      <View style={styles.checkboxRow}>
        <Switch value={notifyWhatsApp} onValueChange={setNotifyWhatsApp} />
        <Text style={styles.checkboxLabel}>WhatsApp (Coming Soon)</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Sign Up" onPress={handleSignup} color="#6A0DAD" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6A0DAD",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 16,
  },
});