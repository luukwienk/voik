import React from 'react';
import { signInWithGoogle } from './firebase';
import { getAuth, signOut } from 'firebase/auth';

const SignIn = () => {
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Handle successful sign-in
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Handle successful sign-out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
      <button onClick={handleSignIn}>Sign in with Google</button>
      <button onClick={handleSignOut}>Sign out</button>
    </div>
  );
};

export default SignIn;
