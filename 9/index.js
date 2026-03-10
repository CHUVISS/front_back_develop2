const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());

const PORT = 3000;
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const users = [];
const products = [
    { id: 1, name: "Ноутбук", price: 50000 },
    { id: 2, name: "Мышка", price: 1500 },
    { id: 3, name: "Клавиатура", price: 3000 }
];

const refreshTokens = new Set();

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, username: user.username },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, username: user.username },
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
                        username: { type: "string" },
                    },
                },
                Product: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        price: { type: "integer" },
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
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации
 */
app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: "username already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: String(users.length + 1),
        username,
        passwordHash,
    };
    users.push(user);
    res.status(201).json({ id: user.id, username: user.username });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (получение пары токенов)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Неверные учетные данные
 */
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов по refresh-токену
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Токены успешно обновлены
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Недействительный или истёкший refresh-токен
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

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение данных текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Токен недействителен
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user.id, username: user.username });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", authMiddleware, (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: integer }
 *     responses:
 *       200:
 *         description: Товар обновлен
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const { name, price } = req.body;
    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    res.json({ message: "Product updated", product });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Товар удален
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
    const index = products.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "Product not found" });
    products.splice(index, 1);
    res.json({ message: "Product deleted" });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger документация: http://localhost:${PORT}/api-docs`);
});