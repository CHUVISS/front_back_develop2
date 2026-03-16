import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/contexts/AuthContext';
import { ThemeProvider } from './components/contexts/ThemeContext';
import Navbar from './components/Layout/Navbar';
import PrivateRoute from './components/Layout/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import ProductDetail from './components/Products/ProductDetail';
import Users from './components/Users/Users';
import './styles/variables.scss';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart(prevCart => [...prevCart, product]);
    alert(`${product.title} добавлен в корзину!`);
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="app">
          <Navbar cartCount={cart.length} />
          
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route 
                path="/products" 
                element={
                  <PrivateRoute>
                    <ProductList onAddToCart={addToCart} />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/products/:id" 
                element={
                  <PrivateRoute>
                    <ProductDetail onAddToCart={addToCart} />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/products/add" 
                element={
                  <PrivateRoute>
                    <ProductForm />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/products/edit/:id" 
                element={
                  <PrivateRoute>
                    <ProductForm />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/users" 
                element={
                  <PrivateRoute>
                    <Users />
                  </PrivateRoute>
                } 
              />
              
              <Route path="/" element={<Navigate to="/products" replace />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;