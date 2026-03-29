const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const port = 3000;

let products = [
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

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}][${req.method}] ${res.statusCode} ${req.path}`);
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            console.log('Body:', req.body);
        }
    });
    next();
});

function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// POST /api/products
app.post("/api/products", (req, res) => {
    const { title, category, description, price, quantity, rating, image } = req.body;
    
    if (!title || price === undefined || quantity === undefined) {
        return res.status(400).json({ error: "Title, price and quantity are required" });
    }
    if (price < 0 || quantity < 0) {
        return res.status(400).json({ error: "Price and quantity must be non-negative" });
    }

    const newProduct = {
        id: nanoid(6),
        title: title.trim(),
        category: category?.trim() || "Общее",
        description: description?.trim() || "",
        price: Number(price),
        quantity: Number(quantity),
        rating: rating ? Number(rating) : 0,
        image: image?.trim() || "https://via.placeholder.com/150",
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// GET /api/products
app.get("/api/products", (req, res) => {
    res.json(products);
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

// PATCH /api/products/:id
app.patch("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;

    const { title, category, description, price, quantity, rating, image } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) {
        if (price < 0) return res.status(400).json({ error: "Price must be non-negative" });
        product.price = Number(price);
    }
    if (quantity !== undefined) {
        if (quantity < 0) return res.status(400).json({ error: "Quantity must be non-negative" });
        product.quantity = Number(quantity);
    }
    if (rating !== undefined) product.rating = Number(rating);
    if (image !== undefined) product.image = image.trim();

    res.json(product);
});

// DELETE /api/products/:id
app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some((p) => p.id === id);
    if (!exists) return res.status(404).json({ error: "Product not found" });

    products = products.filter((p) => p.id !== id);
    res.status(204).send();
});

// 404 & Error Handling
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});