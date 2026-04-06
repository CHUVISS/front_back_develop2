const express    = require('express');
const http       = require('http');
const socketIo   = require('socket.io');
const webpush    = require('web-push');
const bodyParser = require('body-parser');
const cors       = require('cors');
const path       = require('path');

// ─── VAPID-ключи ─────────────────────────────────────────────────────────────
// Сгенерированы командой: npx web-push generate-vapid-keys
// Замените на свои ключи, если хотите использовать собственный домен/email
const vapidKeys = {
  publicKey:  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls'
};

webpush.setVapidDetails(
  'mailto:example@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(bodyParser.json());

// Раздаём статику из текущей папки (рядом с server.js)
app.use(express.static(path.join(__dirname, './')));

// ─── Хранилище push-подписок (in-memory) ─────────────────────────────────────
let subscriptions = [];

// ─── WebSocket ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[WS] Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    console.log('[WS] Новая задача:', task.text);

    // Рассылаем всем подключённым клиентам (включая отправителя)
    io.emit('taskAdded', task);

    // Push-уведомление всем подписанным
    const payload = JSON.stringify({
      title: 'Новая задача',
      body:  task.text
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload)
        .catch(err => {
          console.error('[Push] Ошибка отправки:', err.statusCode, err.message);
          // Удаляем устаревшую подписку
          if (err.statusCode === 410 || err.statusCode === 404) {
            subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
          }
        });
    });
  });

  socket.on('disconnect', () => {
    console.log('[WS] Клиент отключён:', socket.id);
  });
});

// ─── REST-эндпоинты для подписок ─────────────────────────────────────────────
app.post('/subscribe', (req, res) => {
  const sub = req.body;
  const exists = subscriptions.some(s => s.endpoint === sub.endpoint);
  if (!exists) subscriptions.push(sub);
  console.log('[Push] Подписка сохранена. Всего:', subscriptions.length);
  res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
  console.log('[Push] Подписка удалена. Всего:', subscriptions.length);
  res.status(200).json({ message: 'Подписка удалена' });
});

// ─── Запуск ───────────────────────────────────────────────────────────────────
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});