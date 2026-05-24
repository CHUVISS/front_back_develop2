# Практика 27 — Брокеры сообщений: RabbitMQ

## Архитектура

```
POST /tasks (Express API)
       │
       ▼
  [task_queue]  ←──── Producer отправляет задачи
       │
       ├── Worker 1 (читает, обрабатывает, retry)
       ├── Worker 2 (читает, обрабатывает, retry)
       │
       │  если все попытки исчерпаны
       ▼
  [dlx_exchange]
       │
       ▼
  [dead_letter_queue]  ←── DLQ Monitor читает для анализа
```

## Структура проекта

```
practice27/
├── docker-compose.yml       ← запуск RabbitMQ
├── package.json
└── src/
    ├── setup-queues.js      ← создание очередей (запустить один раз)
    ├── producer.js          ← Express API: POST /tasks
    ├── worker.js            ← Consumer с Retry + DLQ
    ├── retry.js             ← утилита экспоненциальной задержки
    └── dlq-monitor.js       ← просмотр неудачных задач
```

## Запуск (шаг за шагом)

### 1. Запустить RabbitMQ

```bash
docker compose up -d
```

Веб-интерфейс: http://localhost:15672 (логин: `guest`, пароль: `guest`)

### 2. Установить зависимости

```bash
npm install
```

### 3. Создать очереди (один раз)

```bash
npm run setup
```

### 4. Запустить воркеры (в отдельных терминалах)

```bash
# Терминал 1
WORKER_ID=1 node src/worker.js

# Терминал 2
WORKER_ID=2 node src/worker.js
```

### 5. Запустить продюсер (в отдельном терминале)

```bash
npm run producer
# → http://localhost:3001
```

### 6. Отправить задачи

```bash
# Добавить 5 тестовых задач сразу:
curl http://localhost:3001/tasks/demo

# Добавить одну задачу вручную:
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"email","payload":{"to":"user@example.com","subject":"Привет"}}'

curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"report","payload":{"userId":42,"period":"Q4-2025"}}'

curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"image","payload":{"fileId":"img-001","width":800,"height":600}}'
```

### 7. Просмотр Dead Letter Queue

```bash
npm run dlq-monitor
```

## Что наблюдать в терминалах воркеров

- Воркеры чередуются при получении задач (Round-Robin распределение)
- При ошибке видны повторные попытки с нарастающей задержкой
- После 3 неудачных попыток задача уходит в DLQ

## Типы задач

| type     | Описание                    | Задержка обработки |
|----------|-----------------------------|--------------------|
| `email`  | Отправка email              | ~800ms             |
| `report` | Генерация отчёта            | ~1200ms            |
| `image`  | Обработка изображения       | ~600ms             |

## Вероятность ошибки

40% задач намеренно завершаются ошибкой для демонстрации Retry Logic и DLQ.
Изменить: константа `FAIL_CHANCE` в `src/worker.js`.
