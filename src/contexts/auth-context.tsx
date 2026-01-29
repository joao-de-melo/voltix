import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, getUserDocument } from "@/lib/firebase/auth";
import { getDocuments, collections } from "@/lib/firebase/firestore";
import type { User, Membership } from "@/types";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  memberships: Membership[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  refreshUser: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    memberships: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = async () => {
    if (!state.firebaseUser) return;
    const user = await getUserDocument(state.firebaseUser.uid);
    setState((prev) => ({ ...prev, user }));
  };

  const refreshMemberships = async () => {
    if (!state.firebaseUser) return;
    const memberships = await getDocuments<Membership>(
      collections.userMemberships(state.firebaseUser.uid)
    );
    setState((prev) => ({ ...prev, memberships }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const [user, memberships] = await Promise.all([
            getUserDocument(firebaseUser.uid),
            getDocuments<Membership>(
              collections.userMemberships(firebaseUser.uid)
            ),
          ]);

          setState({
            firebaseUser,
            user,
            memberships,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Error loading user data:", error);
          setState({
            firebaseUser,
            user: null,
            memberships: [],
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        setState({
          firebaseUser: null,
          user: null,
          memberships: [],
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refreshUser,
        refreshMemberships,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
