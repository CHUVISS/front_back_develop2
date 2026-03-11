import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { products as productsApi } from '../../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../Common/Loader';
import styles from './ProductForm.module.scss';

const ProductForm = () => {
  const { id } = useParams(); // Получаем ID из URL (если есть)
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEdit = Boolean(id); // Режим редактирования, если есть ID
  
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
  const [fetching, setFetching] = useState(false); // Для загрузки данных при редактировании
  const [error, setError] = useState('');

  // Загрузка данных товара при монтировании в режиме редактирования
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
        // 🔹 Обновление существующего товара
        await productsApi.update(id, productData);
      } else {
        // 🔹 Создание нового товара
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

  // Пока данные загружаются (только для режима редактирования)
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
        {isEdit ? '✏️ Редактировать товар' : '➕ Добавить новый товар'}
      </h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="title">Название *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Например: Смартфон X"
            required
            disabled={loading || fetching}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label htmlFor="category">Категория</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Электроника"
              disabled={loading || fetching}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="price">Цена (₽) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="59990"
              min="0"
              required
              disabled={loading || fetching}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label htmlFor="quantity">Количество</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="15"
              min="0"
              disabled={loading || fetching}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="rating">Рейтинг</label>
            <input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="4.5"
              min="0"
              max="5"
              step="0.1"
              disabled={loading || fetching}
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="description">Описание</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Описание товара..."
            rows="3"
            disabled={loading || fetching}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="image">URL изображения</label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            disabled={loading || fetching}
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