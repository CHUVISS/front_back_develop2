import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

export const QUEUES = {
  MAIN: 'task_queue',
  DLQ: 'dead_letter_queue',
};

export const EXCHANGES = {
  DLX: 'dlx_exchange',
};

async function setupQueues() {
  console.log('Подключение к RabbitMQ...');
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // 1. Dead Letter Exchange
  await channel.assertExchange(EXCHANGES.DLX, 'direct', { durable: true });
  console.log(`✓ Exchange "${EXCHANGES.DLX}" создан`);

  // 2. Dead Letter Queue
  await channel.assertQueue(QUEUES.DLQ, { durable: true });
  await channel.bindQueue(QUEUES.DLQ, EXCHANGES.DLX, 'dead');
  console.log(`✓ Очередь "${QUEUES.DLQ}" создана и привязана к DLX`);

  // 3. Основная очередь с настройкой DLX
  await channel.assertQueue(QUEUES.MAIN, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGES.DLX,
      'x-dead-letter-routing-key': 'dead',
    },
  });
  console.log(`✓ Очередь "${QUEUES.MAIN}" создана (DLX настроен)`);

  console.log('\nСхема маршрутизации:');
  console.log(`  Producer → "${QUEUES.MAIN}" → [при ошибке] → "${EXCHANGES.DLX}" → "${QUEUES.DLQ}"`);

  await connection.close();
  console.log('\nНастройка завершена. Теперь запустите воркеры и продюсер.');
}

await setupQueues();
