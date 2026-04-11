const express    = require('express');
const http       = require('http');
const socketIo   = require('socket.io');
const webpush    = require('web-push');
const bodyParser = require('body-parser');
const cors       = require('cors');
const path       = require('path');

// VAPID-ключи
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

app.use(express.static(path.join(__dirname, './')));

let subscriptions = [];

const reminders = new Map();

// WebSocket
io.on('connection', (socket) => {
  console.log('[WS] Клиент подключён:', socket.id);

  socket.on('newTask', (task) => {
    console.log('[WS] Новая задача:', task.text);

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

  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();

    if (delay <= 0) {
      console.warn('[Reminder] Время напоминания уже прошло, id:', id);
      return;
    }

    console.log('[Reminder] Запланировано напоминание:', text, 'через', Math.round(delay / 1000), 'сек');

    const timeoutId = setTimeout(() => {
      const payload = JSON.stringify({
        title:      '!!! Напоминание',
        body:       text,
        reminderId: id
      });

      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload)
          .catch(err => {
            console.error('[Push] Ошибка отправки напоминания:', err.statusCode, err.message);
            if (err.statusCode === 410 || err.statusCode === 404) {
              subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
            }
          });
      });

      reminders.delete(id);
      console.log('[Reminder] Напоминание отправлено и удалено, id:', id);

      io.emit('reminderFired', { id, text });
    }, delay);

    // сохраняем данные напоминания для последующего snooze
    reminders.set(id, { timeoutId, text, reminderTime });
  });

  socket.on('disconnect', () => {
    console.log('[WS] Клиент отключён:', socket.id);
  });
});

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

app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    console.warn('[Snooze] Напоминание не найдено, id:', reminderId);
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);

  // отменяем старый таймер
  clearTimeout(reminder.timeoutId);

  // устанавливаем новый таймер через 5 минут (300 000 мс)
  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title:      'Напоминание отложено',
      body:       reminder.text,
      reminderId: reminderId 
    });

    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload)
        .catch(err => console.error('[Push] Ошибка отправки отложенного напоминания:', err));
    });

    reminders.delete(reminderId);
    console.log('[Snooze] Отложенное напоминание отправлено, id:', reminderId);
    io.emit('reminderFired', { id: reminderId, text: reminder.text });
  }, newDelay);

  // обновляем хранилище с новым таймером и временем
  reminders.set(reminderId, {
    timeoutId:    newTimeoutId,
    text:         reminder.text,
    reminderTime: Date.now() + newDelay
  });

  console.log('[Snooze] Напоминание отложено на 5 мин, id:', reminderId);
  res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3006;
server.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});