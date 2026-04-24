const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const usersRouter = require('./routes/users');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users_db';

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Users API Docs',
  swaggerOptions: { defaultModelsExpandDepth: 1 },
}));

//Маршруты
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'Users API',
    docs: `http://localhost:${PORT}/api/docs`,
    endpoints: [
      { method: 'POST',   path: '/api/users' },
      { method: 'GET',    path: '/api/users' },
      { method: 'GET',    path: '/api/users/:id' },
      { method: 'PATCH',  path: '/api/users/:id' },
      { method: 'DELETE', path: '/api/users/:id' },
    ],
  });
});

// Подключение к MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`MongoDB подключена: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`Сервер: http://localhost:${PORT}`);
      console.log(`Swagger: http://localhost:${PORT}/api/docs`);
    });
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });
