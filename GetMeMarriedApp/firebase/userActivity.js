
import { db } from "./config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Update user's last activity timestamp
export const updateUserActivity = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};

// Track specific user actions
export const trackUserAction = async (userId, action, metadata = {}) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastActivity: serverTimestamp(),
      [`actions.${action}`]: {
        timestamp: serverTimestamp(),
        ...metadata,
      },
    });
  } catch (error) {
    console.error("Error tracking user action:", error);
  }
};
