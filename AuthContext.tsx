import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as authSignOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { ref, get, set } from "firebase/database";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  dbError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  dbError: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setDbError(null);
      
      if (currentUser) {
        try {
          const userRef = ref(db, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            setProfile(snapshot.val());
          } else {
            // Initialize empty profile
            const newProfile = {
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Player",
              score: 0,
              gamesPlayed: 0
            };
            await set(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error: any) {
          console.error("Firebase DB Error:", error);
          if (error.message?.includes('Permission denied')) {
            setDbError("Acesso negado no banco de dados. Atualize as regras de segurança no painel do Firebase.");
          } else {
            setDbError(error.message || "Erro ao conectar com banco de dados.");
          }
          // Set a fallback profile so the user isn't stuck
          setProfile({
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Player",
            score: 0,
            gamesPlayed: 0
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await authSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, dbError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
