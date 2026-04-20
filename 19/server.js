require('dotenv').config();

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

// Swagger конфигурация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'API для управления пользователями (Практическое занятие 19)',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['first_name', 'last_name', 'age'],
          properties: {
            id: {
              type: 'integer',
              description: 'Уникальный идентификатор пользователя',
            },
            first_name: {
              type: 'string',
              description: 'Имя пользователя',
              example: 'Иван',
            },
            last_name: {
              type: 'string',
              description: 'Фамилия пользователя',
              example: 'Петров',
            },
            age: {
              type: 'integer',
              description: 'Возраст пользователя',
              example: 25,
            },
            created_at: {
              type: 'integer',
              description: 'Unix timestamp создания записи',
            },
            updated_at: {
              type: 'integer',
              description: 'Unix timestamp последнего обновления',
            },
          },
        },
        CreateUser: {
          type: 'object',
          required: ['first_name', 'last_name', 'age'],
          properties: {
            first_name: {
              type: 'string',
              example: 'Иван',
            },
            last_name: {
              type: 'string',
              example: 'Петров',
            },
            age: {
              type: 'integer',
              example: 25,
            },
          },
        },
        UpdateUser: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              example: 'Иван',
            },
            last_name: {
              type: 'string',
              example: 'Петров',
            },
            age: {
              type: 'integer',
              example: 26,
            },
          },
        },
      },
    },
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Подключение к PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

// Модель User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 150 },
  },
  created_at: { type: DataTypes.BIGINT },
  updated_at: { type: DataTypes.BIGINT },
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: (user) => {
      const now = Math.floor(Date.now() / 1000);
      user.created_at = now;
      user.updated_at = now;
    },
    beforeUpdate: (user) => {
      user.updated_at = Math.floor(Date.now() / 1000);
    }
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создание нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации данных
 *       500:
 *         description: Ошибка сервера
 */
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name || age === undefined) {
      return res.status(400).json({ error: 'Поля first_name, last_name и age обязательны' });
    }
    const user = await User.create({ first_name, last_name, age });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получение списка всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Ошибка сервера
 */
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получение пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Обновление данных пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: Пользователь успешно обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
app.patch('/api/users/:id', async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    const [count, rows] = await User.update(
      {
        ...(first_name !== undefined && { first_name }),
        ...(last_name  !== undefined && { last_name }),
        ...(age        !== undefined && { age }),
        updated_at: Math.floor(Date.now() / 1000),
      },
      {
        where: { id: req.params.id },
        returning: true,
      }
    );
    if (count === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удаление пользователя
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь успешно удалён
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
app.delete('/api/users/:id', async (req, res) => {
  try {
    const count = await User.destroy({ where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Подключение к PostgreSQL успешно');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
      console.log(`Swagger документация доступна на http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('Ошибка подключения к БД:', err.message);
  });

module.exports = app;