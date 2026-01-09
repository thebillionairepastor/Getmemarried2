
// firebase/guardianMetrics.js

import { db } from "./config";
import { doc, setDoc, getDoc, increment } from "firebase/firestore";

// Call when a verification is completed
export const updateGuardianMetrics = async (guardianId, isVerified) => {
  const metricsRef = doc(db, "guardianMetrics", guardianId);
  const snapshot = await getDoc(metricsRef);

  let existingData = snapshot.exists()
    ? snapshot.data()
    : {
        totalCompleted: 0,
        totalRejected: 0,
        totalPayout: 0,
        points: 0,
      };

  const updates = {
    totalCompleted: existingData.totalCompleted + (isVerified ? 1 : 0),
    totalRejected: existingData.totalRejected + (!isVerified ? 1 : 0),
    points: existingData.points + (isVerified ? 10 : -2),
    lastUpdated: new Date(),
  };

  updates.completionRate = Math.floor(
    (updates.totalCompleted /
      (updates.totalCompleted + updates.totalRejected)) *
      100,
  );

  // Optional: assign rank
  updates.rank =
    updates.points > 200
      ? "Platinum"
      : updates.points > 100
        ? "Gold"
        : updates.points > 50
          ? "Silver"
          : "Bronze";

  await setDoc(
    metricsRef,
    {
      guardianId,
      ...updates,
    },
    { merge: true },
  );
};
