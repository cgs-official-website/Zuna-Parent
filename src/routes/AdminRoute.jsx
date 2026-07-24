import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AdminRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (adminDoc.exists() && adminDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            // Auto bootstrap if document is missing
            await setDoc(adminDocRef, {
              email: user.email,
              role: 'admin',
              createdAt: serverTimestamp()
            });
            setIsAdmin(true);
          }
        } catch (err) {
          console.error("Error verifying admin role:", err);
          setIsAdmin(false);
          // If we hit this, they DEFINITELY haven't updated the rules in the Firebase console
          setErrorMsg("Permission Denied: You must paste the updated rules into the Firebase Console before you can log in.");
          await signOut(auth); // Sign them out to prevent infinite looping
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Checking authentication...</div>;
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', background: '#0a192f' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Almost there!</h2>
        <p style={{ maxWidth: '400px', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.6' }}>{errorMsg}</p>
        <button 
          onClick={() => { setErrorMsg(''); window.location.href='/admin'; }}
          style={{ background: '#00f2fe', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
