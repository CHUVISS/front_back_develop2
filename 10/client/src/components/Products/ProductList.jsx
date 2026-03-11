import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { products as productsApi } from '../../services/api';
import ProductCard from './ProductCard';
import Loader from '../Common/Loader';
import styles from './Products.module.scss';

const ProductList = ({ onAddToCart }) => {
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
      console.error('Failed to load products:', err);
      setError('Не удалось загрузить товары. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Каталог товаров</h1>
          <Link to="/products/add" className={styles.addBtn}>
            + Добавить товар
          </Link>
        </div>
        <Loader fullPage />
      </>
    );
  }

  return (
    <>
      {/* 🔹 Заголовок с кнопкой — отображается ВСЕГДА */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Каталог товаров</h1>
        <Link to="/products/add" className={styles.addBtn}>
          + Добавить товар
        </Link>
      </div>

      {/* 🔹 Сообщение об ошибке */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadProducts}>Попробовать снова</button>
        </div>
      )}

      {/* 🔹 Пустой список */}
      {!error && products.length === 0 && (
        <div className={styles.empty}>
          <p>Товары не найдены</p>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Нажмите «Добавить товар», чтобы создать первый
          </p>
        </div>
      )}

      {/* 🔹 Сетка товаров */}
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