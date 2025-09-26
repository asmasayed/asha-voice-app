import React, { useState } from 'react';
// Import the functions we need from Firebase
import { doc, setDoc } from "firebase/firestore"; 
import { auth, db } from './firebase'; // Import auth and db from our firebase.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import './App.css';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // --- NEW STATE VARIABLES ---
  // State for all the sign-up form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [ashaId, setAshaId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  
  // State to hold and display any error messages
  const [error, setError] = useState('');

  // --- LOGIN HANDLER ---
 const handleLogin = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      // Use the signInWithEmailAndPassword function from Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // Just like with sign-up, onAuthStateChanged in App.jsx will handle the redirect!
    } catch (err) {
      // If login fails (e.g., wrong password), show an error
      setError(err.message);
      console.error("Error during login:", err);
    }
  };

  // --- UPDATED SIGN-UP HANDLER ---
  const handleSignUp = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors

    try {
      // Step 1: Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Save the additional user data to Firestore
      // We create a document in the 'users' collection with the user's UID as the document ID
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        username: username,
        ashaId: ashaId,
        email: email,
        location: location
      });
      
      // If both steps are successful, the onAuthStateChanged listener in App.jsx
      // will automatically handle redirecting to the homepage. No need for code here!

    } catch (err) {
      // Handle any errors from Firebase
      setError(err.message); // Display a user-friendly error
      console.error("Error during sign up:", err);
    }
  };

  return (
    <div className="auth-container">
      {isLoginView ? (
        // --- LOGIN FORM (Updated to use state) ---
        <form className="auth-form" onSubmit={handleLogin}>
          <h2>Login</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input 
              id="login-email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input 
              id="login-password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div className="checkbox-group">
            <input id="remember-me" type="checkbox" />
            <label htmlFor="remember-me">Remember me</label>
          </div>
          <button type="submit">Log In</button>
          <p className="toggle-form">
            Don't have an account?{' '}
            <span onClick={() => { setIsLoginView(false); setError(''); }}>Sign up</span>
          </p>
        </form>
      ) : (
        // --- SIGN-UP FORM (Updated to use state) ---
        <form className="auth-form" onSubmit={handleSignUp}>
          <h2>Sign Up</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="signup-name">Name</label>
            <input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
           <div className="input-group">
            <label htmlFor="signup-username">Username</label>
            <input id="signup-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="signup-asha-id">Asha ID</label>
            <input id="signup-asha-id" type="text" value={ashaId} onChange={(e) => setAshaId(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="signup-location">Location</label>
            <input id="signup-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
          <div className="checkbox-group">
            <input id="signup-remember" type="checkbox" />
            <label htmlFor="signup-remember">Remember me</label>
          </div>
          <button type="submit">Sign Up</button>
          <p className="toggle-form">
            Have an account?{' '}
            <span onClick={() => { setIsLoginView(true); setError(''); }}>Log in</span>
          </p>
        </form>
      )}
    </div>
  );
};

export default AuthPage;