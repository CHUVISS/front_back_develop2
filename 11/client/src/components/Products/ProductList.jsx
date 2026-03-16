import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { products as productsApi } from '../../services/api';
import ProductCard from './ProductCard';
import Loader from '../Common/Loader';
import { useAuth } from '../contexts/AuthContext';
import styles from './Products.module.scss';

const ProductList = ({ onAddToCart }) => {
  const { isSeller, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll();
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Каталог товаров</h1>
          {(isSeller() || isAdmin()) && (
            <Link to="/products/add" className={styles.addBtn}>
              <span className={styles.btnIcon}>➕</span>
              Добавить товар
            </Link>
          )}
        </div>
        <Loader fullPage />
      </>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Каталог товаров</h1>
        {/* 🔹 Кнопка только для Seller и Admin */}
        {(isSeller() || isAdmin()) && (
          <Link to="/products/add" className={styles.addBtn}>
            <span className={styles.btnIcon}>➕</span>
            Добавить товар
          </Link>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadProducts}>Попробовать снова</button>
        </div>
      )}

      {!error && products.length === 0 && (
        <div className={styles.empty}>
          <p>Товары не найдены</p>
        </div>
      )}

      {!error && products.length > 0 && (
        <div className={styles.grid}>
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ProductList;