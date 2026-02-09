const express = require('express');
const app = express();
const port = 3000;

let products = [
    {id: 1, name: 'Ноутбук', price: 50000},
    {id: 2, name: 'Смартфон', price: 30000},
    {id: 3, name: 'Наушники', price: 5000}
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API для управления товарами');
});

// CRUD операции для товаров

// 1. Получение всех товаров
app.get('/products', (req, res) => {
    res.json(products);
});

// 2. Получение товара по ID
app.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(product);
});

// 3. Создание нового товара
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ error: 'Название и стоимость товара обязательны' });
    }
    
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Стоимость должна быть положительным числом' });
    }
    
    const newProduct = {
        id: Date.now(),
        name,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// 4. Обновление товара
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
        return res.status(400).json({ error: 'Стоимость должна быть положительным числом' });
    }
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    
    res.json(product);
});

// 5. Удаление товара
app.delete('/products/:id', (req, res) => {
    const initialLength = products.length;
    products = products.filter(p => p.id != req.params.id);
    
    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.send('Ok');
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});