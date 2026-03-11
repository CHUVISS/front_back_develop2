import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Auth.module.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Invalid email format');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName
      );
      
      if (success) {
        navigate('/products', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Register</h2>
      
      {(error || validationError) && (
        <div className={styles.error}>{error || validationError}</div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter your first name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter your last name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Choose a password (min. 6 characters)"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className={styles.links}>
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </div>
  );
};

export default Register;