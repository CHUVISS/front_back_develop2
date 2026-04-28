import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Products.module.scss';

const ProductCard = ({ product, onAddToCart }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className={styles.star}>★</span>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i} className={`${styles.star} ${styles.half}`}>★</span>);
      } else {
        stars.push(<span key={i} className={styles.star}>☆</span>);
      }
    }
    return stars;
  };

  const title = product.title || product.name;
  const image = product.image || 'https://via.placeholder.com/400x300?text=No+Image';
  const category = product.category || 'Без категории';
  const description = product.description || '';
  const quantity = product.quantity !== undefined ? product.quantity : 0;
  const rating = product.rating || 0;

  return (
    <article className={styles.card}>
      <Link to={`/products/${product.id}`} className={styles.imageWrapper}>
        <img 
          src={image} 
          alt={title}
          className={styles.image}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
        />
        {quantity === 0 && (
          <span className={styles.badge}>Нет в наличии</span>
        )}
        {quantity > 0 && quantity < 5 && (
          <span className={`${styles.badge} ${styles.warning}`}>Осталось: {quantity}</span>
        )}
      </Link>

      <div className={styles.content}>
        <span className={styles.category}>{category}</span>
        
        <Link to={`/products/${product.id}`} className={styles.title}>
          {title}
        </Link>
        
        {description && (
          <p className={styles.description}>{description}</p>
        )}

        <div className={styles.meta}>
          {rating > 0 && (
            <div className={styles.rating}>
              {renderStars(rating)}
              <span className={styles.ratingValue}>{rating}</span>
            </div>
          )}
          <span className={styles.price}>{formatPrice(product.price)}</span>
        </div>

        <button 
          className={`${styles.addButton} ${quantity === 0 ? styles.disabled : ''}`}
          onClick={() => onAddToCart?.(product)}
          disabled={quantity === 0}
        >
          {quantity === 0 ? 'Нет в наличии' : 'В корзину'}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;