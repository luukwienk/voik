import React from 'react';
import { signInWithGoogle } from './firebase';
import { getAuth, signOut } from 'firebase/auth';
import './styles/signin.css';

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
    <div className="signin-container">
      <div className="signin-content">
        <img src="/taskbuddy-logo.png" alt="TaskBuddy Logo" className="signin-logo" />
        <h1>TaskBuddy</h1>
        <p>Beheer je taken en agenda op één plek</p>
        {user ? (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={handleSignOut} className="signout-button">Uitloggen</button>
          </div>
        ) : (
          <button onClick={handleSignIn} className="signin-button">
            Inloggen met Google
          </button>
        )}
      </div>
    </div>
  );
};

export default SignIn;
