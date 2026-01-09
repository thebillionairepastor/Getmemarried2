
// firebase/matchingLogic.js

import { db } from "./config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// Function to automatically assign a guardian to a user
export const assignGuardianAutomatically = async (userId) => {
  try {
    // Query to find available guardians
    const q = query(
      collection(db, "users"),
      where("accountType", "==", "guardian"),
      orderBy("createdAt", "asc"),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const guardian = snapshot.docs[0];
      return guardian.id;
    }
    
    return null;
  } catch (error) {
    console.error("Error assigning guardian:", error);
    return null;
  }
};
