import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOutUser } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User signed in:', user);
        setUser(user);
      } else {
        console.log('User signed out');
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signOut = () => {
    signOutUser()
      .then(() => console.log('User signed out successfully'))
      .catch((error) => console.error('Error signing out:', error));
  };

  return { user, signOut };
}