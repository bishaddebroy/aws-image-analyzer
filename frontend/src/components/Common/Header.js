import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isAuthenticated, user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  const handleLogout = () => {
    onLogout();
    closeMenu();
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <Link to="/" onClick={closeMenu}>
            <span className="logo-icon">🔍</span>
            <span className="logo-text">Image Recognition</span>
          </Link>
        </div>
        
        <button 
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className="menu-icon"></span>
        </button>
        
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated ? (
            <>
              <ul className="nav-links">
                <li>
                  <Link 
                    to="/" 
                    className={isActive('/') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    Upload
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/gallery" 
                    className={isActive('/gallery') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    Gallery
                  </Link>
                </li>
              </ul>
              
              <div className="user-area">
                <div className="user-info">
                  <span className="user-icon">👤</span>
                  <span className="user-email">{user?.email || 'User'}</span>
                </div>
                
                <button 
                  className="logout-button"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <ul className="nav-links">
              <li>
                <Link 
                  to="/login" 
                  className={`auth-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  Log In
                </Link>
              </li>
              <li>
                <Link 
                  to="/signup" 
                  className={`auth-link signup ${isActive('/signup') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;