import amqplib from 'amqplib';
import { QUEUES } from './setup-queues.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function monitorDLQ() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUES.DLQ, { durable: true });

  // Проверяем количество сообщений в DLQ
  const queueInfo = await channel.checkQueue(QUEUES.DLQ);
  console.log(`[DLQ Monitor] Сообщений в "${QUEUES.DLQ}": ${queueInfo.messageCount}`);

  if (queueInfo.messageCount === 0) {
    console.log('[DLQ Monitor] DLQ пуста — все задачи обработаны успешно.');
    await connection.close();
    return;
  }

  console.log('[DLQ Monitor] Читаю сообщения из DLQ (без удаления):\n');

  let count = 0;
  // get с noAck=false позволяет читать и возвращать сообщения обратно
  while (true) {
    const msg = await channel.get(QUEUES.DLQ, { noAck: false });
    if (!msg) break;

    count++;
    const task = JSON.parse(msg.content.toString());
    const headers = msg.properties.headers || {};

    console.log(`── Сообщение #${count} ──────────────────────`);
    console.log('  ID задачи:', task.id);
    console.log('  Тип:', task.type);
    console.log('  Payload:', JSON.stringify(task.payload));
    console.log('  Создана:', task.createdAt);
    console.log('  Причина попадания в DLQ:', headers['x-death']?.[0]?.reason || 'rejected');
    console.log();

    // Возвращаем сообщение в очередь (не удаляем) — для повторной обработки
    channel.nack(msg, false, true);
  }

  console.log(`[DLQ Monitor] Показано ${count} сообщений. Они возвращены в DLQ.`);
  console.log('[DLQ Monitor] Для повторной обработки скопируйте задачу и отправьте через POST /tasks');

  await connection.close();
}

await monitorDLQ();
