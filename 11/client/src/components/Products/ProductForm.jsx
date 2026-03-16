import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { products as productsApi } from '../../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../Common/Loader';
import styles from './ProductForm.module.scss';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    quantity: '',
    rating: '',
    image: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setFetching(true);
      const response = await productsApi.getById(id);
      const product = response.data;
      
      setFormData({
        title: product.title || product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '0',
        rating: product.rating?.toString() || '0',
        image: product.image || ''
      });
      setError('');
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Не удалось загрузить данные товара');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price) {
      setError('Название и цена обязательны');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        title: formData.title,
        category: formData.category || 'Без категории',
        description: formData.description,
        price: Number(formData.price),
        quantity: Number(formData.quantity) || 0,
        rating: Number(formData.rating) || 0,
        image: formData.image || 'https://via.placeholder.com/400x300?text=No+Image'
      };

      if (isEdit) {
        await productsApi.update(id, productData);
      } else {
        await productsApi.create(productData);
      }
      
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при сохранении товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching && isEdit) {
    return <Loader fullPage />;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Требуется авторизация</div>
        <button onClick={() => navigate('/login')} className={styles.submitBtn}>
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {isEdit ? 'Редактировать товар' : 'Добавить новый товар'}
      </h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Название <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Например: Наушники Bass"
            required
            disabled={loading || fetching}
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="category" className={styles.label}>
              Категория
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Аксессуары"
              disabled={loading || fetching}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Цена (₽) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="7990"
              min="0"
              required
              disabled={loading || fetching}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label htmlFor="quantity" className={styles.label}>
              Количество
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="50"
              min="0"
              disabled={loading || fetching}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rating" className={styles.label}>
              Рейтинг
            </label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="4,2"
              min="0"
              max="5"
              step="0.1"
              disabled={loading || fetching}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Глубокий бас и шумоподавление"
            rows="3"
            disabled={loading || fetching}
            className={`${styles.input} ${styles.textarea}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="image" className={styles.label}>
            URL изображения
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://ir.ozone.ru/s3/multimedia-g/6506434732.jpg"
            disabled={loading || fetching}
            className={styles.input}
          />
        </div>

        <div className={styles.buttons}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={() => navigate('/products')}
            disabled={loading || fetching}
          >
            Отмена
          </button>
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading || fetching}
          >
            {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать товар')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;