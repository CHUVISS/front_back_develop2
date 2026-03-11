import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.scss';

const Navbar = ({ cartCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/products" className={styles.logo}>
          🛒 ShopApp
        </Link>
        
        <div className={styles.menu}>
          {user ? (
            <>
              {/* 👇 Отображение имени пользователя */}
              <span className={styles.userName}>
                👤 {user.firstName} {user.lastName}
              </span>
              <Link to="/products" className={styles.link}>Products</Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.link}>Login</Link>
              <Link to="/register" className={`${styles.link} ${styles.register}`}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;