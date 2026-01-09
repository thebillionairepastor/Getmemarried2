
import { db } from "./config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

// Check for matches that should be disconnected due to inactivity
export const checkInactiveMatches = async () => {
  try {
    const matchesRef = collection(db, "matches");
    const q = query(matchesRef, where("status", "==", "active"));
    const snapshot = await getDocs(q);

    const now = new Date();
    
    for (const matchDoc of snapshot.docs) {
      const match = matchDoc.data();
      const matchCreated = match.createdAt.toDate();
      const daysSinceMatch = (now - matchCreated) / (1000 * 60 * 60 * 24);

      // Check if 30 days have passed without engagement
      if (daysSinceMatch > 30) {
        // Check if there's no engagement for this match
        const engagementRef = doc(db, "engagements", matchDoc.id);
        const engagementSnap = await getDocs(engagementRef);

        if (!engagementSnap.exists()) {
          // Disconnect the match
          await updateDoc(doc(db, "matches", matchDoc.id), {
            status: "disconnected",
            reason: "no_engagement_after_30_days",
            disconnectedAt: Timestamp.now(),
          });
          
          console.log(`Match ${matchDoc.id} disconnected due to inactivity`);
        }
      }
    }
  } catch (error) {
    console.error("Error checking inactive matches:", error);
  }
};

// Auto-rematch users after 2 days of inactivity
export const autoRematchInactiveUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("verified", "==", true),
      where("matched", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const now = new Date();
    
    for (const userDoc of snapshot.docs) {
      const user = userDoc.data();
      const lastActivity = user.lastActivity?.toDate() || user.createdAt?.toDate();
      
      if (lastActivity) {
        const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
        
        if (daysSinceActivity > 2) {
          // Mark user as eligible for rematching
          await updateDoc(doc(db, "users", userDoc.id), {
            eligibleForRematch: true,
            lastRematchCheck: Timestamp.now(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking for rematch eligibility:", error);
  }
};
