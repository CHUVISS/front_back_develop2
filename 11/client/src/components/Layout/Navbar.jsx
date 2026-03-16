import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.scss';

const Navbar = ({ cartCount = 0 }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleConfig = (role) => {
    const roles = {
      admin: { label: 'Admin', icon: '👑', className: styles.roleAdmin },
      seller: { label: 'Seller', icon: '🏪', className: styles.roleSeller },
      user: { label: 'User', icon: '👤', className: styles.roleUser }
    };
    return roles[role] || roles.user;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/products" className={styles.logo}>
          <span className={styles.logoIcon}>🛒</span>
          <span className={styles.logoText}>ShopApp</span>
        </Link>
        
        <div className={styles.menu}>
          {user ? (
            <>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {user.firstName} {user.lastName}
                </div>
                <div className={`${styles.roleBadge} ${getRoleConfig(user.role).className}`}>
                  <span className={styles.roleIcon}>{getRoleConfig(user.role).icon}</span>
                  <span className={styles.roleLabel}>{getRoleConfig(user.role).label}</span>
                </div>
              </div>

              <Link to="/products" className={styles.navLink}>Products</Link>
              
              {isAdmin() && (
                <Link to="/users" className={`${styles.navLink} ${styles.adminLink}`}>
                  Users
                </Link>
              )}
              
              {cartCount > 0 && (
                <div className={styles.cartBadge}>
                  <span className={styles.cartCount}>{cartCount}</span>
                </div>
              )}

              <ThemeToggle />

              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/register" className={`${styles.navLink} ${styles.registerLink}`}>
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