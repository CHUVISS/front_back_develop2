const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { nanoid } = require("nanoid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const users = [];

// Начальные товары (новый формат)
const products = [
  { id: nanoid(6), title: 'Смартфон X', category: 'Электроника', description: 'Мощный смартфон с хорошей камерой', price: 59990, quantity: 15, rating: 4.5, image: 'https://avatars.mds.yandex.net/get-mpic/5228105/2a00000191f2f0d3dbf11a0962caa1ce3eeb/orig' },
  { id: nanoid(6), title: 'Ноутбук Pro', category: 'Электроника', description: 'Для работы и игр', price: 120000, quantity: 5, rating: 4.8, image: 'https://avatars.mds.yandex.net/i?id=8661b9a98397af67a3a2e9af43e3cb40_l-5235167-images-thumbs&n=13' },
  { id: nanoid(6), title: 'Наушники Bass', category: 'Аксессуары', description: 'Глубокий бас и шумоподавление', price: 7990, quantity: 50, rating: 4.2, image: 'https://ir.ozone.ru/s3/multimedia-g/6506434732.jpg' },
  { id: nanoid(6), title: 'Книга "React"', category: 'Книги', description: 'Изучаем фронтенд разработку', price: 1500, quantity: 100, rating: 5.0, image: 'https://habrastorage.org/getpro/habr/upload_files/d23/66a/51a/d2366a51a042ce88a5df59e549193662.jpeg' },
  { id: nanoid(6), title: 'Кофемашина', category: 'Бытовая техника', description: 'Варит лучший эспрессо', price: 45000, quantity: 8, rating: 4.7, image: 'https://avatars.mds.yandex.net/get-mpic/1539743/img_id9117419135669886059.jpeg/orig' },
  { id: nanoid(6), title: 'Кроссовки Run', category: 'Одежда', description: 'Удобные для бега', price: 8500, quantity: 30, rating: 4.3, image: 'https://avatars.mds.yandex.net/get-mpic/14067069/2a00000196f4aa83c3de266bd0672f1343fb/orig' },
  { id: nanoid(6), title: 'Часы Smart', category: 'Электроника', description: 'Фитнес-трекер и уведомления', price: 12990, quantity: 20, rating: 4.4, image: 'https://avatars.mds.yandex.net/i?id=3d31f05d7713fb632d43b51af0cdb54e_l-5215694-images-thumbs&n=13' },
  { id: nanoid(6), title: 'Клавиатура Mech', category: 'Аксессуары', description: 'Механическая клавиатура', price: 6500, quantity: 12, rating: 4.6, image: 'https://www.icover.ru/upload/iblock/03a/03a31e19e548d64982af517d8a136616.jpg' },
  { id: nanoid(6), title: 'Монитор 32"', category: 'Электроника', description: '6K разрешение, OLED-матрица', price: 400000, quantity: 7, rating: 4.5, image: 'https://ir.ozone.ru/s3/multimedia-1-i/w1200/7006444146.jpg' },
  { id: nanoid(6), title: 'Рюкзак City', category: 'Одежда', description: 'Вместительный городской рюкзак', price: 3500, quantity: 40, rating: 4.1, image: 'https://avatars.mds.yandex.net/get-mpic/4450422/img_id892506502926914999.jpeg/600x800' },
];

const refreshTokens = new Set();

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Практического занятия №9",
      version: "1.0.0",
      description: "Документация для JWT аутентификации с refresh-токенами",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            price: { type: "integer" },
            quantity: { type: "integer" },
            rating: { type: "number" },
            image: { type: "string" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            errorCode: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./index.js"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

/**
 * @swagger
 * /api/auth/register:
 * post:
 *   summary: Регистрация нового пользователя
 *   tags: [Auth]
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required: [email, password, firstName, lastName]
 *           properties:
 *             email: { type: string }
 *             password: { type: string }
 *             firstName: { type: string }
 *             lastName: { type: string }
 *   responses:
 *     201:
 *       description: Пользователь создан
 *     400:
 *       description: Ошибка валидации
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(users.length + 1),
    email,
    passwordHash,
    firstName,
    lastName
  };
  
  users.push(user);
  res.status(201).json({ 
    id: user.id, 
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  });
});

/**
 * @swagger
 * /api/auth/login:
 * post:
 *   summary: Вход в систему (получение пары токенов)
 *   tags: [Auth]
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required: [email, password]
 *           properties:
 *             email: { type: string }
 *             password: { type: string }
 *   responses:
 *     200:
 *       description: Успешный вход
 *     401:
 *       description: Неверный пароль
 *     404:
 *       description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({ 
      error: "User not found",
      errorCode: "USER_NOT_FOUND"
    });
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ 
      error: "Invalid password",
      errorCode: "INVALID_PASSWORD"
    });
  }
  
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  
  res.json({ 
    accessToken, 
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 * post:
 *   summary: Обновление пары токенов по refresh-токену
 *   tags: [Auth]
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           required: [refreshToken]
 *           properties:
 *             refreshToken: { type: string }
 *   responses:
 *     200:
 *       description: Токены успешно обновлены
 *     401:
 *       description: Недействительный или истёкший refresh-токен
 */
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 * get:
 *   summary: Получение данных текущего пользователя
 *   tags: [Auth]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Данные пользователя
 *     401:
 *       description: Токен недействителен
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json({ 
    id: user.id, 
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  });
});

/**
 * @swagger
 * /api/products:
 * get:
 *   summary: Получить список товаров
 *   tags: [Products]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Список товаров
 */
app.get("/api/products", authMiddleware, (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 * post:
 *   summary: Создать новый товар
 *   tags: [Products]
 *   security:
 *     - bearerAuth: []
 *   requestBody:
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             title: { type: string }
 *             category: { type: string }
 *             description: { type: string }
 *             price: { type: integer }
 *             quantity: { type: integer }
 *             rating: { type: number }
 *             image: { type: string }
 *   responses:
 *     201:
 *       description: Товар создан
 */
app.post("/api/products", authMiddleware, (req, res) => {
  const { title, category, description, price, quantity, rating, image } = req.body;
  
  if (!title || price === undefined) {
    return res.status(400).json({ error: "title and price are required" });
  }
  
  const newProduct = {
    id: nanoid(6),
    title,
    category: category || "Без категории",
    description: description || "",
    price,
    quantity: quantity || 0,
    rating: rating || 0,
    image: image || "https://via.placeholder.com/400x300?text=No+Image"
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 * get:
 *   summary: Получить товар по ID
 *   tags: [Products]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *   responses:
 *     200:
 *       description: Данные товара
 *     404:
 *       description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 * put:
 *   summary: Обновить товар
 *   tags: [Products]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *   requestBody:
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             title: { type: string }
 *             category: { type: string }
 *             description: { type: string }
 *             price: { type: integer }
 *             quantity: { type: integer }
 *             rating: { type: number }
 *             image: { type: string }
 *   responses:
 *     200:
 *       description: Товар обновлен
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  
  const { title, category, description, price, quantity, rating, image } = req.body;
  
  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (quantity !== undefined) product.quantity = quantity;
  if (rating !== undefined) product.rating = rating;
  if (image !== undefined) product.image = image;
  
  res.json({ message: "Product updated", product });
});

/**
 * @swagger
 * /api/products/{id}:
 * delete:
 *   summary: Удалить товар
 *   tags: [Products]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *   responses:
 *     200:
 *       description: Товар удален
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });
  products.splice(index, 1);
  res.json({ message: "Product deleted" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Swagger документация: http://localhost:${PORT}/api-docs`);
});