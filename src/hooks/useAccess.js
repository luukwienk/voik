import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// TaskBuddy is invite-only: the Firestore rules only let allowlisted, verified accounts
// read their own data. A read of the user's root doc tells us which side we are on.
// Returns 'checking' | 'allowed' | 'denied'.
export function useAccess(user) {
  const [access, setAccess] = useState('checking');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setAccess('checking');
    getDoc(doc(db, 'users', user.uid))
      .then(() => !cancelled && setAccess('allowed'))
      .catch((err) => !cancelled && setAccess(err.code === 'permission-denied' ? 'denied' : 'allowed'));
    return () => { cancelled = true; };
  }, [user]);

  return access;
}
