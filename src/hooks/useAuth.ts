import { useState, useEffect } from 'react';
import {
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!cancelled) setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!cancelled) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Google sign-in timeout')), 30000);
    });
    
    return Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise
    ]).then((result) => (result as UserCredential).user);
  };

  const logOut = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    await signOut(auth);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
  };
}
