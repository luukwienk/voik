import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOutUser } from '../firebase';
import { debugLog, debugError } from '../utils/debug';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        debugLog('User signed in:', user);
        setUser(user);
      } else {
        debugLog('User signed out');
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signOut = () => {
    signOutUser()
      .then(() => debugLog('User signed out successfully'))
      .catch((error) => debugError('Error signing out:', error));
  };

  return { user, signOut };
}