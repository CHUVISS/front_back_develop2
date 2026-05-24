import express from 'express';
import amqplib from 'amqplib';
import { QUEUES } from './setup-queues.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const PORT = process.env.PORT || 3001;

// Подключение к RabbitMQ
let channel;

async function connectRabbit() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUES.MAIN, { durable: true });
  console.log(`[Producer] Подключён к RabbitMQ, очередь "${QUEUES.MAIN}" готова`);
}

// Express API
const app = express();
app.use(express.json());

// POST /tasks — принять задачу и поместить в очередь
app.post('/tasks', async (req, res) => {
  const { type, payload } = req.body;

  if (!type || !payload) {
    return res.status(400).json({ error: 'Поля "type" и "payload" обязательны' });
  }

  const task = {
    id: `task-${Date.now()}`,
    type,   
    payload,
    createdAt: new Date().toISOString(),
  };

  // sendToQueue — помещает сообщение в очередь.
  channel.sendToQueue(
    QUEUES.MAIN,
    Buffer.from(JSON.stringify(task)),
    { persistent: true }
  );

  console.log(`[Producer] Задача добавлена в очередь:`, task);

  res.status(202).json({
    message: 'Задача принята в обработку',
    task,
  });
});

// GET /tasks/demo — создать несколько тестовых задач сразу
app.get('/tasks/demo', async (req, res) => {
  const demoTasks = [
    { type: 'email',  payload: { to: 'alice@example.com', subject: 'Добро пожаловать!' } },
    { type: 'report', payload: { userId: 42, period: 'Q4-2025' } },
    { type: 'image',  payload: { fileId: 'img-001', width: 800, height: 600 } },
    { type: 'email',  payload: { to: 'bob@example.com', subject: 'Ваш заказ отправлен' } },
    { type: 'report', payload: { userId: 17, period: 'Q1-2026' } },
  ];

  for (const t of demoTasks) {
    const task = { id: `task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...t, createdAt: new Date().toISOString() };
    channel.sendToQueue(QUEUES.MAIN, Buffer.from(JSON.stringify(task)), { persistent: true });
    console.log(`[Producer] Демо-задача отправлена:`, task.id, task.type);
  }

  res.json({ message: `${demoTasks.length} демо-задач добавлено в очередь` });
});

// GET / — справка
app.get('/', (_, res) => {
  res.json({
    endpoints: {
      'POST /tasks': 'Добавить задачу. Body: { type, payload }',
      'GET /tasks/demo': 'Добавить 5 тестовых задач',
    },
    taskTypes: ['email', 'report', 'image'],
    queue: QUEUES.MAIN,
  });
});

await connectRabbit();
app.listen(PORT, () => {
  console.log(`[Producer] HTTP API запущен на http://localhost:${PORT}`);
  console.log(`[Producer] Тест: GET http://localhost:${PORT}/tasks/demo`);
});
