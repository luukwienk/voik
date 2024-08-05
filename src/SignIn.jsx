import React from 'react';
import { signInWithGoogle } from './firebase';
import { getAuth, signOut } from 'firebase/auth';

const SignIn = ({ user }) => {
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
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={handleSignOut}>Sign out</button>
        </>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};

export default SignIn;
