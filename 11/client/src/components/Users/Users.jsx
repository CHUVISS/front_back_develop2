import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../Common/Loader';
import styles from './Users.module.scss';

const Users = () => {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      setError('Доступ запрещён. Требуется роль администратора.');
      setLoading(false);
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить пользователей');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userData) => {
    setEditingId(userData.id);
    setEditData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      blocked: userData.blocked
    });
    setSuccessMessage('');
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/users/${id}`, editData);
      setEditingId(null);
      setSuccessMessage('Пользователь обновлён');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadUsers();
    } catch (err) {
      setError('Не удалось обновить пользователя');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleBlock = async (id) => {
    const userToBlock = users.find(u => u.id === id);
    if (!window.confirm(`${userToBlock.blocked ? 'Разблокировать' : 'Заблокировать'} пользователя ${userToBlock.firstName} ${userToBlock.lastName}?`)) return;
    
    try {
      await api.put(`/users/${id}`, { blocked: !userToBlock.blocked });
      setSuccessMessage(`Пользователь ${userToBlock.blocked ? 'разблокирован' : 'заблокирован'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadUsers();
    } catch (err) {
      setError('Не удалось изменить статус блокировки');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find(u => u.id === id);
    
    if (id === user?.id) {
      setError('Нельзя удалить самого себя');
      return;
    }
    
    if (!window.confirm(`Удалить пользователя ${userToDelete.firstName} ${userToDelete.lastName}? Это действие необратимо.`)) return;
    
    try {
      await api.delete(`/users/${id}`);
      setSuccessMessage('Пользователь удалён');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadUsers();
    } catch (err) {
      setError('Не удалось удалить пользователя');
      console.error(err);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Admin', color: '#7c3aed' },
      seller: { text: 'Seller', color: '#2563eb' },
      user: { text: 'User', color: '#64748b' }
    };
    return badges[role] || badges.user;
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление пользователями</h1>
        <Link to="/products" className={styles.backLink}>Назад к товарам</Link>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(userData => (
              <tr key={userData.id} className={userData.blocked ? styles.blockedRow : ''}>
                {editingId === userData.id ? (
                  <>
                    <td>{userData.id}</td>
                    <td>
                      <div className={styles.nameInputs}>
                        <input
                          value={editData.firstName}
                          onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                          placeholder="Имя"
                        />
                        <input
                          value={editData.lastName}
                          onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                          placeholder="Фамилия"
                        />
                      </div>
                    </td>
                    <td>{userData.email}</td>
                    <td>
                      <select
                        value={editData.role}
                        onChange={(e) => setEditData({...editData, role: e.target.value})}
                      >
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <label className={styles.blockToggle}>
                        <input
                          type="checkbox"
                          checked={editData.blocked}
                          onChange={(e) => setEditData({...editData, blocked: e.target.checked})}
                        />
                        {editData.blocked ? 'Заблокирован' : 'Активен'}
                      </label>
                    </td>
                    <td>
                      <button onClick={() => handleSave(userData.id)} className={styles.saveBtn} title="Сохранить">
                        Сохранить
                      </button>
                      <button onClick={handleCancel} className={styles.cancelBtn} title="Отмена">
                        Отмена
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{userData.id}</td>
                    <td>{userData.firstName} {userData.lastName}</td>
                    <td>{userData.email}</td>
                    <td>
                      <span 
                        className={styles.roleBadge}
                        style={{ backgroundColor: getRoleBadge(userData.role).color }}
                      >
                        {getRoleBadge(userData.role).text}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${userData.blocked ? styles.statusBlocked : styles.statusActive}`}>
                        {userData.blocked ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(userData)} className={styles.editBtn} title="Редактировать">
                        Редактировать
                      </button>
                      {/* Убрана кнопка блокировки для самого себя */}
                      {userData.id !== user?.id && (
                        <button 
                          onClick={() => handleBlock(userData.id)} 
                          className={styles.blockBtn}
                          title={userData.blocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {userData.blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      )}
                      {userData.id !== user?.id && (
                        <button 
                          onClick={() => handleDelete(userData.id)} 
                          className={styles.deleteBtn}
                          title="Удалить"
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{users.length}</span>
          <span className={styles.statLabel}>Всего пользователей</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{users.filter(u => u.role === 'admin').length}</span>
          <span className={styles.statLabel}>Администраторов</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{users.filter(u => u.role === 'seller').length}</span>
          <span className={styles.statLabel}>Продавцов</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{users.filter(u => u.blocked).length}</span>
          <span className={styles.statLabel}>Заблокировано</span>
        </div>
      </div>
    </div>
  );
};

export default Users;