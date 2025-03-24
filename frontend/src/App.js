import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GalleryPage from './pages/GalleryPage';
import AnalysisPage from './pages/AnalysisPage';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import { checkAuthStatus } from './services/auth';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus.isAuthenticated);
      setUser(authStatus.user);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUser(null);
  };
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <Router>
      <div className="app">
        <Header 
          isAuthenticated={isAuthenticated} 
          user={user} 
          onLogout={handleLogout} 
        />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/gallery" 
              element={isAuthenticated ? <GalleryPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/analysis/:imageId" 
              element={isAuthenticated ? <AnalysisPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/signup" 
              element={!isAuthenticated ? <SignUp onSignUp={handleLogin} /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;