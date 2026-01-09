
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export default function NewsFlashBar() {
  const [celebrations, setCelebrations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = new Animated.Value(0);

  useEffect(() => {
    loadActiveCelebrations();
  }, []);

  useEffect(() => {
    if (celebrations.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % celebrations.length);
      }, 3000); // Change every 3 seconds

      return () => clearInterval(interval);
    }
  }, [celebrations]);

  const loadActiveCelebrations = () => {
    const now = Timestamp.now();
    const celebrationsRef = collection(db, "celebrations");
    const q = query(
      celebrationsRef,
      where("expiresAt", ">", now)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const celebrationsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCelebrations(celebrationsList);
    });

    return unsubscribe;
  };

  if (celebrations.length === 0) return null;

  const currentCelebration = celebrations[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.flashBar}>
        <Text style={styles.flashIcon}>🎉</Text>
        <Text style={styles.flashText}>
          {currentCelebration?.message || "New celebration!"}
        </Text>
        <Text style={styles.flashIcon}>🎉</Text>
      </View>
      
      {celebrations.length > 1 && (
        <View style={styles.indicators}>
          {celebrations.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFD700",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  flashBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  flashIcon: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  flashText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: "#333",
  },
});
