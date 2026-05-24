export async function processWithRetry(message, processor, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 15000,
    workerId = '?',
  } = options;

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      await processor(message);
      if (attempt > 0) {
        console.log(`[Worker ${workerId}][Retry] Успешно за попытку #${attempt + 1}`);
      }
      return;
    } catch (err) {
      attempt++;

      if (attempt > maxRetries) {
        console.error(`[Worker ${workerId}][Retry] Все ${maxRetries} попытки исчерпаны. → DLQ`);
        throw err;
      }

      const exponentialDelay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * 500;
      const delay = Math.round(exponentialDelay + jitter);

      console.warn(
        `[Worker ${workerId}][Retry] Попытка ${attempt}/${maxRetries} провалилась: "${err.message}". ` +
        `Повтор через ${delay}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
