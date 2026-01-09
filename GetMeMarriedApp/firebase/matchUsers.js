// firebase/matchUsers.js

import { db } from "./config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";

/**
 * Auto-match two verified users based on gender preference
 * Only matches users that are not yet matched
 */
export const autoMatchUsers = async () => {
  try {
    const usersRef = collection(db, "users");

    // Step 1: Get all VERIFIED users not yet matched
    const q = query(usersRef, where("verified", "==", true));
    const snapshot = await getDocs(q);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const unmatched = users.filter((u) => !u.matched);

    // Group by gender and preference
    const malesSeekingFemales = unmatched.filter(
      (u) => u.gender === "male" && u.preference === "female",
    );
    const femalesSeekingMales = unmatched.filter(
      (u) => u.gender === "female" && u.preference === "male",
    );

    // Step 2: Try to pair them
    if (malesSeekingFemales.length > 0 && femalesSeekingMales.length > 0) {
      const male = malesSeekingFemales[0];
      const female = femalesSeekingMales[0];

      // Step 3: Save the match to Firestore
      const matchData = {
        userA: male.id,
        userB: female.id,
        createdAt: Timestamp.now(),
        status: "active",
      };

      await addDoc(collection(db, "matches"), matchData);

      console.log("✅ Match created:", male.email, "❤️", female.email);
    } else {
      console.log("⚠️ No compatible users found yet.");
    }
  } catch (err) {
    console.error("Match error:", err.message);
  }
};
