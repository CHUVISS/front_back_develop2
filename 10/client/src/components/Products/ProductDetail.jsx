import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products as productsApi } from '../../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../Common/Loader';
import styles from './Products.module.scss';

const ProductDetail = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getById(id);
      setProduct(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Товар не найден или произошла ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await productsApi.delete(id);
      navigate('/products');
    } catch (err) {
      setError('Не удалось удалить товар');
    }
  };

  if (loading) return <Loader fullPage />;

  if (error || !product) {
    return (
      <div className={styles.error}>
        <p>{error || 'Товар не найден'}</p>
        <Link to="/products" className={styles.backLink}>← Вернуться к каталогу</Link>
      </div>
    );
  }

  const title = product.title || product.name;
  const image = product.image || 'https://via.placeholder.com/400x300?text=No+Image';
  const quantity = product.quantity !== undefined ? product.quantity : 0;

  return (
    <div className={styles.detailContainer}>
      <Link to="/products" className={styles.backLink}>← Назад к каталогу</Link>
      
      <div className={styles.detailGrid}>
        <div className={styles.detailImage}>
          <img src={image} alt={title} />
        </div>

        <div className={styles.detailInfo}>
          <span className={styles.category}>{product.category || 'Без категории'}</span>
          <h1 className={styles.detailTitle}>{title}</h1>
          
          <div className={styles.detailMeta}>
            <span className={styles.detailPrice}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(product.price)}
            </span>
            {product.rating > 0 && (
              <span className={styles.detailRating}>★ {product.rating}</span>
            )}
          </div>

          {product.description && (
            <p className={styles.detailDescription}>{product.description}</p>
          )}

          <div className={styles.detailActions}>
            <button 
              className={styles.addToCartBtn}
              onClick={() => onAddToCart?.(product)}
              disabled={quantity === 0}
            >
              {quantity === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
            </button>

            {user && (
              <div className={styles.adminActions}>
                <Link to={`/products/edit/${id}`} className={styles.editBtn}>
                  Редактировать
                </Link>
                <button onClick={handleDelete} className={styles.deleteBtn}>
                  Удалить
                </button>
              </div>
            )}
          </div>

          <p className={styles.stockStatus}>
            {quantity > 0 ? `В наличии: ${quantity} шт.` : 'Товар закончился'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;