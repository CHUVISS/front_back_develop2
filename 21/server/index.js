const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { nanoid } = require("nanoid");
const { createClient } = require("redis");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// REDIS: Время жизни кэша
const USERS_CACHE_TTL = 60;      // 1 минута
const PRODUCTS_CACHE_TTL = 600;  // 10 минут

// Пользователи с начальным админом
const users = [];

// Товары
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

// REDIS: Создаём и настраиваем клиент Redis
const redisClient = createClient({ url: "redis://127.0.0.1:6379" });
redisClient.on("error", (err) => console.error("Redis error:", err));

async function initRedis() {
  await redisClient.connect();
  console.log("✅ Redis connected");
}

// REDIS: Middleware для чтения из кэша
function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        // Если данные в кэше — возвращаем их сразу
        return res.json({ source: "cache", data: JSON.parse(cachedData) });
      }
      
      // Если кэш пуст — сохраняем ключ и TTL в запрос для последующего использования
      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error("Cache read error:", err);
      next(); // При ошибке кэша идём дальше без кэша
    }
  };
}

// REDIS: Функция сохранения данных в кэш
async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error("Cache save error:", err);
  }
}

// REDIS: Очистка кэша пользователей
async function invalidateUsersCache(userId = null) {
  try {
    await redisClient.del("users:all");
    if (userId) await redisClient.del(`users:${userId}`);
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

// REDIS: Очистка кэша товаров
async function invalidateProductsCache(productId = null) {
  try {
    await redisClient.del("products:all");
    if (productId) await redisClient.del(`products:${productId}`);
  } catch (err) {
    console.error("Products cache invalidate error:", err);
  }
}

function generateAccessToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// Middleware для проверки аутентификации
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

// Middleware для проверки ролей (RBAC)
function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden",
        errorCode: "INSUFFICIENT_PERMISSIONS",
        message: `Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}

async function initializeAdmin() {
  const adminExists = users.find(u => u.email === "admin@shopapp.com");
  
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    users.push({
      id: "1",
      email: "admin@shopapp.com",
      passwordHash,
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      blocked: false
    });
    console.log("Администратор создан: admin@shopapp.com / admin123");
  }
}

// AUTH
app.post("/api/auth/register", async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
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
    lastName,
    role: role || "user",
    blocked: false
  };
  
  users.push(user);
  res.status(201).json({ 
    id: user.id, 
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  });
});

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

  if (user.blocked) {
    return res.status(403).json({ 
      error: "Account is blocked",
      errorCode: "ACCOUNT_BLOCKED"
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
      lastName: user.lastName,
      role: user.role
    }
  });
});

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

    if (user.blocked) {
      return res.status(403).json({ error: "Account is blocked" });
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
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

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
    lastName: user.lastName,
    role: user.role
  });
});

// USERS (Admin Only)

/**
 * @swagger
 * /api/users:
 * get:
 *   summary: Получить список пользователей (Только Админ)
 *   tags: [Users]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Список пользователей
 *     403:
 *       description: Доступ запрещён
 */
// REDIS: Добавлен cacheMiddleware для кэширования ответа (TTL: 60 сек)
app.get("/api/users", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL), 
  (req, res) => {
    const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);
    // REDIS: Сохраняем данные в кэш после получения
    saveToCache(req.cacheKey, usersWithoutPassword, req.cacheTTL);
    res.json({ source: "server", data: usersWithoutPassword });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 * get:
 *   summary: Получить пользователя по ID (Только Админ)
 *   tags: [Users]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *   responses:
 *     200:
 *       description: Данные пользователя
 */
// REDIS: Добавлен cacheMiddleware для кэширования ответа по ID (TTL: 60 сек)
app.get("/api/users/:id", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL), 
  (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const { passwordHash, ...userWithoutPassword } = user;
    // REDIS: Сохраняем данные в кэш после получения
    saveToCache(req.cacheKey, userWithoutPassword, req.cacheTTL);
    res.json({ source: "server", data: userWithoutPassword });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 * put:
 *   summary: Обновить пользователя (Только Админ)
 *   tags: [Users]
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
 *             firstName: { type: string }
 *             lastName: { type: string }
 *             role: { type: string, enum: ["user", "seller", "admin"] }
 *             blocked: { type: boolean }
 *   responses:
 *     200:
 *       description: Пользователь обновлён
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const { firstName, lastName, role, blocked } = req.body;
  
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (role !== undefined && ["user", "seller", "admin"].includes(role)) {
    user.role = role;
  }
  if (blocked !== undefined) user.blocked = blocked;
  
  // REDIS: Очищаем кэш пользователя при изменении
  invalidateUsersCache(user.id);
  
  const { passwordHash, ...userWithoutPassword } = user;
  res.json({ message: "User updated", user: userWithoutPassword });
});

/**
 * @swagger
 * /api/users/{id}:
 * delete:
 *   summary: Удалить пользователя (Только Админ)
 *   tags: [Users]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *   responses:
 *     200:
 *       description: Пользователь удалён
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // Нельзя удалить самого себя
  if (users[index].id === req.user.sub) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }
  
  const deletedUser = users[index];
  users.splice(index, 1);
  
  // REDIS: Очищаем кэш пользователя при удалении
  invalidateUsersCache(deletedUser.id);
  
  res.json({ message: "User deleted" });
});

// ==================== PRODUCTS ====================

// REDIS: Добавлен cacheMiddleware для кэширования списка товаров (TTL: 600 сек)
app.get("/api/products", 
  authMiddleware, 
  cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL), 
  (req, res) => {
    // REDIS: Сохраняем данные в кэш после получения
    saveToCache(req.cacheKey, products, req.cacheTTL);
    res.json({ source: "server", data: products });
  }
);

app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
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
    image: image || "https://via.placeholder.com/400x300?text=No+Image",
    createdBy: req.user.sub
  };
  
  products.push(newProduct);
  
  // REDIS: Очищаем кэш товаров при создании нового
  invalidateProductsCache();
  
  res.status(201).json(newProduct);
});

// REDIS: Добавлен cacheMiddleware для кэширования товара по ID (TTL: 600 сек)
app.get("/api/products/:id", 
  authMiddleware, 
  cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL), 
  (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // REDIS: Сохраняем данные в кэш после получения
    saveToCache(req.cacheKey, product, req.cacheTTL);
    res.json({ source: "server", data: product });
  }
);

app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  const { title, category, description, price, quantity, rating, image } = req.body;
  
  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (quantity !== undefined) product.quantity = quantity;
  if (rating !== undefined) product.rating = rating;
  if (image !== undefined) product.image = image;
  
  // REDIS: Очищаем кэш товара при изменении
  invalidateProductsCache(product.id);
  
  res.json({ message: "Product updated", product });
});

app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  
  const deletedProduct = products.splice(index, 1)[0];
  
  // REDIS: Очищаем кэш товара при удалении
  invalidateProductsCache(deletedProduct.id);
  
  res.json({ message: "Product deleted" });
});

// REDIS: Запускаем Redis перед стартом сервера
initRedis().then(() => {
  app.listen(PORT, async () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger документация: http://localhost:${PORT}/api-docs`);
    console.log(`Роли: user, seller, admin`);
    await initializeAdmin();
  });
}).catch(err => {
  console.error("Ошибка запуска сервера:", err);
});