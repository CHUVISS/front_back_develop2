import express from 'express';
import amqplib from 'amqplib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { QUEUES } from './setup-queues.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PORT = process.env.PORT || 3001;

let channel;

async function connectRabbit() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  console.log(`[Producer] Подключён к RabbitMQ, очередь "${QUEUES.MAIN}" готова`);
}

function sendTask(type, payload) {
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  channel.sendToQueue(QUEUES.MAIN, Buffer.from(JSON.stringify(task)), { persistent: true });
  console.log(`[Producer] Задача отправлена:`, task.id, task.type);
  return task;
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

app.post('/tasks', (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ error: 'Поля "type" и "payload" обязательны' });
    }
    const task = sendTask(type, payload);
    res.status(202).json({ message: 'Задача принята в обработку', task });
  } catch (err) {
    console.error('[Producer] Ошибка при отправке задачи:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/tasks/demo/api', (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 5, 50);
    const pool = [
      { type: 'email',  payload: { to: 'alice@example.com', subject: 'Добро пожаловать!' } },
      { type: 'report', payload: { userId: 42, period: 'Q4-2025' } },
      { type: 'image',  payload: { fileId: 'img-001', width: 800, height: 600 } },
      { type: 'email',  payload: { to: 'bob@example.com', subject: 'Ваш заказ отправлен' } },
      { type: 'report', payload: { userId: 17, period: 'Q1-2026' } },
      { type: 'image',  payload: { fileId: 'img-002', width: 1920, height: 1080 } },
      { type: 'email',  payload: { to: 'carol@example.com', subject: 'Уведомление' } },
      { type: 'report', payload: { userId: 99, period: 'Q1-2026' } },
      { type: 'image',  payload: { fileId: 'img-003', width: 1200, height: 900 } },
      { type: 'email',  payload: { to: 'dave@example.com', subject: 'Ваш заказ готов' } },
    ];
    const tasks = Array.from({ length: count }, (_, i) => {
      const t = pool[i % pool.length];
      return sendTask(t.type, t.payload);
    });
    res.json({ message: `${tasks.length} демо-задач добавлено в очередь`, tasks });
  } catch (err) {
    console.error('[Producer] Ошибка при отправке демо-задач:', err.message);
    res.status(500).json({ error: err.message });
  }
});

await connectRabbit();
app.listen(PORT, () => {
  console.log(`[Producer] HTTP API запущен на http://localhost:${PORT}`);
});
