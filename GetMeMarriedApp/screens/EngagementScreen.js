// screens/EngagementScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { auth, db } from "../firebase/config";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function EngagementScreen({ route }) {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { partnerId } = route.params; // matched user’s UID

  const [engaged, setEngaged] = useState(false);

  const handleEngage = async () => {
    try {
      await setDoc(doc(db, "engagements", user.uid), {
        initiatorId: user.uid,
        receiverId: partnerId,
        status: "pending",
        createdAt: Timestamp.now(),
        countdownStart: Timestamp.now(),
      });

      Alert.alert("Engagement Sent", "Waiting for response from your match.");
      setEngaged(true);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💍 Engagement Screen</Text>
      {!engaged ? (
        <Button
          title="Propose Engagement 💍"
          onPress={handleEngage}
          color="#6A0DAD"
        />
      ) : (
        <Text style={styles.info}>⏳ Engagement request sent!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 24,
    color: "#6A0DAD",
    fontWeight: "bold",
  },
  info: {
    textAlign: "center",
    fontSize: 16,
    color: "#444",
  },
});
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function EngagementScreen({ route }) {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { partnerId, matchId } = route.params;
  const [engaged, setEngaged] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [engagementData, setEngagementData] = useState(null);

  useEffect(() => {
    checkEngagementStatus();
  }, []);

  useEffect(() => {
    if (engagementData && engagementData.status === "pending") {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const deadline = engagementData.reviewDeadline.toDate().getTime();
        const distance = deadline - now;

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft("Expired");
          clearInterval(timer);
          // Auto-disconnect match
          disconnectMatch();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [engagementData]);

  const checkEngagementStatus = async () => {
    try {
      const engagementRef = doc(db, "engagements", matchId);
      const engagementSnap = await getDoc(engagementRef);
      
      if (engagementSnap.exists()) {
        setEngagementData(engagementSnap.data());
        setEngaged(true);
      }
    } catch (error) {
      console.error("Error checking engagement:", error);
    }
  };

  const handleEngage = async () => {
    try {
      const reviewDeadline = new Date();
      reviewDeadline.setDate(reviewDeadline.getDate() + 7); // 7 days from now

      const engagementData = {
        initiatorId: user.uid,
        receiverId: partnerId,
        matchId: matchId,
        status: "pending",
        createdAt: Timestamp.now(),
        reviewDeadline: Timestamp.fromDate(reviewDeadline),
        marriageCountdown: null,
      };

      await setDoc(doc(db, "engagements", matchId), engagementData);

      Alert.alert("Engagement Sent! 💍", "Your partner has 7 days to respond.");
      setEngaged(true);
      setEngagementData(engagementData);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const respondToEngagement = async (accept) => {
    try {
      const updates = {
        status: accept ? "accepted" : "rejected",
        respondedAt: Timestamp.now(),
      };

      if (accept) {
        // Set marriage countdown to 30 days
        const marriageDate = new Date();
        marriageDate.setDate(marriageDate.getDate() + 30);
        updates.marriageCountdown = Timestamp.fromDate(marriageDate);
        updates.marriageStatus = "engaged";
      }

      await updateDoc(doc(db, "engagements", matchId), updates);

      if (accept) {
        // Trigger celebration and notifications
        triggerCelebration();
        Alert.alert("Congratulations! 🎉", "You are now engaged! Marriage countdown started.");
      } else {
        Alert.alert("Engagement Declined", "The engagement has been declined.");
        // Disconnect match
        disconnectMatch();
      }

      setEngagementData({ ...engagementData, ...updates });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const triggerCelebration = async () => {
    // Create celebration record for news flash
    await setDoc(doc(db, "celebrations", matchId), {
      type: "engagement",
      matchId: matchId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000)), // 48 hours
      message: "🎉 A new couple got engaged!",
    });
  };

  const disconnectMatch = async () => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        status: "disconnected",
        disconnectedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error disconnecting match:", error);
    }
  };

  const isInitiator = engagementData?.initiatorId === user.uid;
  const isReceiver = engagementData?.receiverId === user.uid;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💍 Engagement Center</Text>
      
      {!engaged ? (
        <View style={styles.section}>
          <Text style={styles.description}>
            Ready to take the next step? Send an engagement request!
          </Text>
          <Button
            title="Propose Engagement 💍"
            onPress={handleEngage}
            color="#6A0DAD"
          />
        </View>
      ) : (
        <View style={styles.section}>
          {engagementData?.status === "pending" && (
            <>
              <Text style={styles.status}>
                {isInitiator ? "⏳ Waiting for response..." : "💍 Engagement proposal received!"}
              </Text>
              
              {timeLeft && (
                <Text style={styles.countdown}>
                  Time left to respond: {timeLeft}
                </Text>
              )}

              {isReceiver && (
                <View style={styles.responseButtons}>
                  <Button
                    title="Accept 💕"
                    onPress={() => respondToEngagement(true)}
                    color="#4CAF50"
                  />
                  <View style={styles.buttonSpace} />
                  <Button
                    title="Decline ❌"
                    onPress={() => respondToEngagement(false)}
                    color="#F44336"
                  />
                </View>
              )}
            </>
          )}

          {engagementData?.status === "accepted" && (
            <View style={styles.celebrationSection}>
              <Text style={styles.celebration}>🎉 CONGRATULATIONS! 🎉</Text>
              <Text style={styles.celebrationText}>You are now engaged!</Text>
              {engagementData.marriageCountdown && (
                <Text style={styles.marriageCountdown}>
                  Marriage countdown: {engagementData.marriageCountdown.toDate().toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {engagementData?.status === "rejected" && (
            <Text style={styles.rejection}>
              💔 Engagement was declined. Match will be disconnected.
            </Text>
          )}
        </View>
      )}
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
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  status: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    color: "#6A0DAD",
  },
  countdown: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  responseButtons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonSpace: {
    width: 16,
  },
  celebrationSection: {
    alignItems: "center",
  },
  celebration: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 8,
  },
  celebrationText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  marriageCountdown: {
    fontSize: 16,
    color: "#6A0DAD",
    textAlign: "center",
  },
  rejection: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
  },
});
