import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import type { User, UserPreferences } from "@/types";

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name
  await updateProfile(credential.user, { displayName });

  // Create user document
  await createUserDocument(credential.user, displayName);

  return credential;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const credential = await signInWithPopup(auth, googleProvider);

  // Check if user document exists, create if not
  const userDoc = await getDoc(doc(db, "users", credential.user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(
      credential.user,
      credential.user.displayName || "User"
    );
  }

  return credential;
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

async function createUserDocument(
  firebaseUser: FirebaseUser,
  displayName: string
): Promise<void> {
  const defaultPreferences: UserPreferences = {
    theme: "system",
    locale: "pt-PT",
    notifications: {
      email: true,
      quoteUpdates: true,
      teamActivity: true,
    },
  };

  const userData: Omit<User, "id"> = {
    email: firebaseUser.email!,
    displayName,
    photoURL: firebaseUser.photoURL || null,
    preferences: defaultPreferences,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, "users", firebaseUser.uid), userData);
}

export async function getUserDocument(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export { auth };
