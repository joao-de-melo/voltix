import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onUserCreate = functions
  .region("europe-west1")
  .auth.user()
  .onCreate(async (user) => {
    try {
      // Check if user document already exists (created during registration)
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        // Create user document
        await db
          .collection("users")
          .doc(user.uid)
          .set({
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "User",
            photoURL: user.photoURL || null,
            preferences: {
              theme: "system",
              locale: "pt-PT",
              notifications: {
                email: true,
                quoteUpdates: true,
                teamActivity: true,
              },
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      console.log(`User document created/verified for ${user.uid}`);
    } catch (error) {
      console.error("Error in onUserCreate:", error);
    }
  });
