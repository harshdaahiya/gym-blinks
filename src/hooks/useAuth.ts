"use client";

/**
 * @file useAuth.ts
 * @description Provides a React Context and custom hook for managing Firebase Authentication state.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

/**
 * Interface representing the AuthContext state.
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailAddress: string, passwordText: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @description Provider component that wraps the app tree and provides authentication state.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to render.
 * @returns {React.ReactElement} The AuthProvider component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribeFromAuth = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setLoadingState(false);
    });

    return () => unsubscribeFromAuth();
  }, []);

  /**
   * @description Authenticates a user with email and password.
   * @param {string} emailAddress - The user's email address.
   * @param {string} passwordText - The user's plaintext password.
   * @returns {Promise<void>} Resolves when authentication succeeds.
   * @throws {Error} Throws if Firebase authentication fails.
   */
  const login = async (emailAddress: string, passwordText: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, emailAddress, passwordText);
    } catch (authError) {
      console.error("Login failed:", authError);
      throw authError;
    }
  };

  /**
   * @description Logs the current user out.
   * @returns {Promise<void>} Resolves when sign out is complete.
   * @throws {Error} Throws if Firebase logout fails.
   */
  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (logoutError) {
      console.error("Logout failed:", logoutError);
      throw logoutError;
    }
  };

  const contextValue: AuthContextType = {
    user: currentUser,
    loading: loadingState,
    login,
    logout,
  };

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
}

/**
 * @description Custom hook to consume the AuthContext state.
 * @returns {AuthContextType} The authentication state and helper methods.
 * @throws {Error} Throws if used outside of an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
