# Users API — Практическое занятие 20

REST API для управления пользователями с использованием Node.js, Express и MongoDB (Mongoose).

## Структура проекта

```
users-api/
├── src/
│   ├── models/
│   │   └── User.js       # Mongoose-схема и модель пользователя
│   ├── routes/
│   │   └── users.js      # Маршруты CRUD для /api/users
│   └── server.js         # Точка входа: подключение к MongoDB и запуск Express
├── package.json
└── README.md
```

## Установка и запуск (macOS M2)

### 1. Установка MongoDB через Homebrew

```bash
# Установить Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Добавить репозиторий MongoDB
brew tap mongodb/brew

# Установить MongoDB Community Edition
brew install mongodb-community

# Запустить MongoDB как системный сервис
brew services start mongodb-community

# Проверить статус
brew services list | grep mongodb
```

### 2. Установка зависимостей проекта

```bash
npm install
```

### 3. Запуск сервера

```bash
# Обычный запуск
npm start

# Запуск с автоперезагрузкой при изменениях (dev-режим)
npm run dev
```

Сервер запустится на http://localhost:3000

---

## Переменные окружения

| Переменная  | По умолчанию                          | Описание              |
|-------------|---------------------------------------|-----------------------|
| `PORT`      | `3000`                                | Порт HTTP-сервера     |
| `MONGO_URI` | `mongodb://localhost:27017/users_db`  | URI подключения к MongoDB |

Пример запуска с кастомными параметрами:
```bash
PORT=8080 MONGO_URI=mongodb://localhost:27017/mydb npm start
```

---

## API-эндпоинты

### Модель пользователя

| Поле         | Тип       | Описание                              |
|--------------|-----------|---------------------------------------|
| `_id`        | ObjectId  | Уникальный идентификатор (MongoDB)    |
| `first_name` | String    | Имя пользователя (обязательное)       |
| `last_name`  | String    | Фамилия пользователя (обязательная)   |
| `age`        | Number    | Возраст (обязательный, >= 0)          |
| `created_at` | Timestamp | Unix-время создания                   |
| `updated_at` | Timestamp | Unix-время последнего обновления      |

---

### POST /api/users — создание пользователя

**Тело запроса:**
```json
{
  "first_name": "Иван",
  "last_name": "Иванов",
  "age": 25
}
```

**Ответ 201:**
```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "first_name": "Иван",
  "last_name": "Иванов",
  "age": 25,
  "created_at": 1716307499,
  "updated_at": 1716307499
}
```

---

### GET /api/users — список всех пользователей

**Ответ 200:**
```json
[
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "first_name": "Иван",
    "last_name": "Иванов",
    "age": 25,
    "created_at": 1716307499,
    "updated_at": 1716307499
  }
]
```

---

### GET /api/users/:id — получение пользователя по ID

```
GET /api/users/664f1a2b3c4d5e6f7a8b9c0d
```

**Ответ 200:** объект пользователя  
**Ответ 404:** `{ "error": "Пользователь не найден" }`

---

### PATCH /api/users/:id — обновление пользователя

```
PATCH /api/users/664f1a2b3c4d5e6f7a8b9c0d
```

**Тело запроса** (можно передавать любые из полей):
```json
{
  "age": 26
}
```

**Ответ 200:** обновлённый объект пользователя (поле `updated_at` обновляется автоматически)

---

### DELETE /api/users/:id — удаление пользователя

```
DELETE /api/users/664f1a2b3c4d5e6f7a8b9c0d
```

**Ответ 200:**
```json
{
  "message": "Пользователь удалён",
  "user": { ... }
}
```

---

## Примеры запросов через curl

```bash
# Создать пользователя
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Иван","last_name":"Иванов","age":25}'

# Получить всех пользователей
curl http://localhost:3000/api/users

# Получить пользователя по ID
curl http://localhost:3000/api/users/<ID>

# Обновить пользователя
curl -X PATCH http://localhost:3000/api/users/<ID> \
  -H "Content-Type: application/json" \
  -d '{"age":26}'

# Удалить пользователя
curl -X DELETE http://localhost:3000/api/users/<ID>
```
