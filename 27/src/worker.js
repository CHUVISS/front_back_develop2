import amqplib from 'amqplib';
import { QUEUES } from './setup-queues.js';
import { processWithRetry } from './retry.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const WORKER_ID = process.env.WORKER_ID || '1';
const MAX_RETRIES = 3;
const FAIL_CHANCE = 0.4;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const taskHandlers = {
  email: async (payload) => {
    await delay(800);
    if (Math.random() < FAIL_CHANCE) throw new Error('SMTP сервер недоступен');
    console.log(`[Worker ${WORKER_ID}] Email отправлен на ${payload.to}: "${payload.subject}"`);
  },

  report: async (payload) => {
    await delay(1200);
    if (Math.random() < FAIL_CHANCE) throw new Error('База данных временно недоступна');
    console.log(`[Worker ${WORKER_ID}] Отчёт сгенерирован для userId=${payload.userId} (${payload.period})`);
  },

  image: async (payload) => {
    await delay(600);
    if (Math.random() < FAIL_CHANCE) throw new Error('Ошибка обработки изображения');
    console.log(`[Worker ${WORKER_ID}] Изображение ${payload.fileId} обработано (${payload.width}x${payload.height})`);
  },
};

async function startWorker() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // prefetch(1) — воркер берёт не более 1 сообщения за раз.
  // Это гарантирует равномерное распределение задач между воркерами:
  // RabbitMQ не отдаст новое сообщение воркеру, пока тот не подтвердит предыдущее.
  channel.prefetch(1);

  console.log(`[Worker ${WORKER_ID}] Запущен. Ожидание задач из "${QUEUES.MAIN}"...`);
  console.log(`[Worker ${WORKER_ID}] Retry: до ${MAX_RETRIES} попыток с экспоненциальной задержкой`);
  console.log(`[Worker ${WORKER_ID}] DLQ: неудачные задачи -> "${QUEUES.DLQ}"\n`);

  channel.consume(QUEUES.MAIN, async (msg) => {
    if (!msg) return;

    const task = JSON.parse(msg.content.toString());
    console.log(`[Worker ${WORKER_ID}] Получена задача: ${task.id} (type: ${task.type})`);

    const handler = taskHandlers[task.type];

    if (!handler) {
      console.error(`[Worker ${WORKER_ID}] Неизвестный тип задачи: "${task.type}" -> DLQ`);
      channel.nack(msg, false, false);
      return;
    }

    try {
      await processWithRetry(task, (t) => handler(t.payload), {
        maxRetries: MAX_RETRIES,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        workerId: WORKER_ID,
      });

      channel.ack(msg);
      console.log(`[Worker ${WORKER_ID}] Задача ${task.id} выполнена\n`);

    } catch (err) {
      console.error(`[Worker ${WORKER_ID}] Задача ${task.id} -> DLQ (${err.message})\n`);
      channel.nack(msg, false, false);
    }
  });
}

await startWorker();
