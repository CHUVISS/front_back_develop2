# 🎓 Фронтенд и бэкенд разработка — Практики 19–23

> **Дисциплина:** Фронтенд и бэкенд разработка  
> **Институт:** ИПТИП | **Кафедра:** Индустриального программирования  
> **Семестр:** 4 семестр, 2025/2026 уч. год  
> **Студент:** Чувилов Александр Александрович

---

## 📋 Содержание

| # | Практика | Тема |
|---|----------|------|
| 19 | [Практика 19](#-практика-19--postgresql) | Работа с реляционными СУБД (PostgreSQL) |
| 20 | [Практика 20](#-практика-20--mongodb) | Работа с NoSQL СУБД (MongoDB) |
| 21 | [Практика 21](#-практика-21--redis) | Кэширование с использованием Redis |
| 22 | [Практика 22](#-практика-22--балансировка-нагрузки) | Балансировка нагрузки в веб-приложениях |
| 23 | [Практика 23](#-практика-23--docker) | Контейнеризация приложений с Docker |

---

## 🐘 Практика 19 — PostgreSQL

### 📌 Что реализовано

REST API для управления пользователями с подключением к PostgreSQL через Sequelize ORM. Реализованы все базовые CRUD-операции, данные хранятся в реляционной таблице с автоматическими временными метками.

### 🛠️ Стек технологий

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)
![Sequelize](https://img.shields.io/badge/Sequelize-ORM-orange)

### 🗂️ Модель данных

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Integer | Уникальный идентификатор |
| `first_name` | Varchar | Имя пользователя |
| `last_name` | Varchar | Фамилия пользователя |
| `age` | Integer | Возраст |
| `created_at` | Timestamp | Время создания (unix) |
| `updated_at` | Timestamp | Время обновления (unix) |

### 🔌 Эндпоинты

| Метод | Адрес | Описание |
|-------|-------|----------|
| `POST` | `/api/users` | Создание пользователя |
| `GET` | `/api/users` | Список всех пользователей |
| `GET` | `/api/users/:id` | Получить пользователя по ID |
| `PATCH` | `/api/users/:id` | Обновить данные пользователя |
| `DELETE` | `/api/users/:id` | Удалить пользователя |

### 🚀 Запуск

```bash
npm install
# Настроить подключение к PostgreSQL в server.js
node server.js
```

---

## 🍃 Практика 20 — MongoDB

### 📌 Что реализовано

REST API для управления пользователями с подключением к MongoDB через Mongoose ODM. В отличие от реляционной БД, данные хранятся в гибкой документной модели, что упрощает работу с вложенными структурами.

### 🛠️ Стек технологий

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4-black)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-red)

### 🗂️ Модель данных

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | ObjectId | Уникальный идентификатор |
| `first_name` | String | Имя пользователя |
| `last_name` | String | Фамилия пользователя |
| `age` | Number | Возраст |
| `created_at` | Date | Время создания |
| `updated_at` | Date | Время обновления |

### 🔌 Эндпоинты

| Метод | Адрес | Описание |
|-------|-------|----------|
| `POST` | `/api/users` | Создание пользователя |
| `GET` | `/api/users` | Список всех пользователей |
| `GET` | `/api/users/:id` | Получить пользователя по ID |
| `PATCH` | `/api/users/:id` | Обновить данные пользователя |
| `DELETE` | `/api/users/:id` | Удалить пользователя |

### 🚀 Запуск

```bash
npm install
# Запустить MongoDB локально или использовать Atlas
node server.js
```

---

## ⚡ Практика 21 — Redis

### 📌 Что реализовано

Слой кэширования поверх существующего приложения с RBAC из практики 11. Redis хранит результаты частых GET-запросов, что значительно снижает нагрузку на базу данных при повторных обращениях.

### 🛠️ Стек технологий

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4-black)
![Redis](https://img.shields.io/badge/Redis-7-red)
![JWT](https://img.shields.io/badge/JWT-Auth-yellow)

### 🔄 Схема кэширования

```
Клиент → Запрос → Сервер → Redis есть? → ДА  → Ответ из кэша
                                        → НЕТ → БД → Сохранить в Redis → Ответ
```

### 📦 Кэшируемые маршруты

| Маршрут | Метод | TTL | Описание |
|---------|-------|-----|----------|
| `/api/users` | `GET` | 60 сек | Список пользователей |
| `/api/users/:id` | `GET` | 60 сек | Пользователь по ID |
| `/api/products` | `GET` | 600 сек | Список товаров |
| `/api/products/:id` | `GET` | 600 сек | Товар по ID |

### 🚀 Запуск

```bash
docker run -d --name redis-cache -p 6379:6379 redis
node server.js
```

### 🧪 Проверка кэша

```bash
# Первый запрос — данные с сервера
curl http://localhost:3000/api/products
# { "source": "server", "data": [...] }

# Повторный запрос — данные из кэша
curl http://localhost:3000/api/products
# { "source": "cache", "data": [...] }
```

---

## ⚖️ Практика 22 — Балансировка нагрузки

### 📌 Что реализовано

Система балансировки нагрузки с тремя backend-серверами. Nginx выступает основным балансировщиком по алгоритму Round Robin, HAProxy настроен как альтернативное решение. Весь стек поднимается одной командой через Docker Compose.

### 🛠️ Стек технологий

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Nginx](https://img.shields.io/badge/Nginx-1.30-brightgreen)
![HAProxy](https://img.shields.io/badge/HAProxy-LB-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

### 📁 Структура проекта

```
kr3.2sem_22/
├── server1.js          # Backend сервер 1
├── server2.js          # Backend сервер 2
├── server3.js          # Backend сервер 3 (резервный)
├── nginx.conf          # Конфиг балансировщика Nginx
├── haproxy.cfg         # Конфиг балансировщика HAProxy
├── Dockerfile          # Образ для backend-серверов
├── docker-compose.yml  # Оркестрация всех сервисов
└── package.json
```

### 🏗️ Архитектура

```
                    ┌─────────────┐
   Запрос ─────────▶│    Nginx    │ :80
                    └──────┬──────┘
                      Round Robin
              ┌───────────┴───────────┐
              ▼                       ▼
        ┌──────────┐           ┌──────────┐
        │ backend1 │ :3000     │ backend2 │ :3000
        └──────────┘           └──────────┘
                       (резерв)
              ┌──────────────────────────┐
              │         backend3         │ :3000
              └──────────────────────────┘
```

### ⚙️ Алгоритм балансировки

- **Round Robin** — запросы поочерёдно распределяются между backend1 и backend2
- **Backup** — backend3 подключается только при падении обоих основных серверов
- **Health Check** — `max_fails=2 fail_timeout=30s` исключает недоступный сервер на 30 секунд

### 🚀 Запуск

```bash
docker compose up --build
```

### 🧪 Проверка балансировки

```bash
curl http://localhost/
# {"message":"Response from backend server","server":"backend-1"}

curl http://localhost/
# {"message":"Response from backend server","server":"backend-2"}

curl http://localhost/
# {"message":"Response from backend server","server":"backend-1"}
```

### 🔥 Проверка отказоустойчивости

```bash
# Остановить один из контейнеров
docker compose stop backend1

# Все запросы теперь идут на backend2
curl http://localhost/
# {"message":"Response from backend server","server":"backend-2"}
```

---

## 🐳 Практика 23 — Docker

### 📌 Что реализовано

Контейнеризация микросервисного приложения, состоящего из API Gateway, сервиса пользователей и сервиса заказов. Изучены ключевые концепции Docker: образы, контейнеры, сети, тома и оркестрация через Compose. Реализован паттерн Circuit Breaker для устойчивости к сбоям.

### 🛠️ Стек технологий

![Docker](https://img.shields.io/badge/Docker-28-blue)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-blue)
![WSL](https://img.shields.io/badge/WSL-2-orange)
![Node.js](https://img.shields.io/badge/Node.js-18_alpine-green)

### 💡 Ключевые концепции

| Понятие | Описание |
|---------|----------|
| **Образ (Image)** | Неизменяемый шаблон для создания контейнера |
| **Контейнер** | Запущенный экземпляр образа |
| **Dockerfile** | Инструкции для сборки образа |
| **Docker Compose** | Управление многоконтейнерными приложениями |
| **Сети (Networks)** | Изолированная среда для общения контейнеров |
| **Тома (Volumes)** | Постоянное хранилище данных вне контейнера |

### 📁 Структура проекта

```
project/
├── docker-compose.yml
├── api_gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js          # Circuit Breaker + API Aggregation
├── service_users/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js          # CRUD пользователей
└── service_orders/
    ├── Dockerfile
    ├── package.json
    └── index.js          # CRUD заказов
```

### 🧰 Основные команды Docker

```bash
# Сборка и запуск всего стека
docker compose up --build

# Запуск в фоновом режиме
docker compose up -d --build

# Просмотр запущенных контейнеров
docker ps

# Логи конкретного сервиса
docker compose logs api_gateway

# Остановка всех сервисов
docker compose down

# Зайти внутрь контейнера
docker compose exec api_gateway sh
```

### 🧪 Тестирование API

```bash
# Статус Gateway
curl http://localhost:8000/status

# Создать пользователя
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Иван Иванов", "email": "ivan@example.com"}'

# Создать заказ
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "product": "Ноутбук", "price": 75000}'

# Агрегированный запрос (пользователь + заказы)
curl http://localhost:8000/users/1/details
```

### 🔌 Circuit Breaker

```bash
# Остановить сервис пользователей
docker compose stop service_users

# Gateway вернёт fallback-ответ вместо ошибки
curl http://localhost:8000/users/1
# {"error": "Users service temporarily unavailable"}
```

---

## 🚀 Быстрый старт (Практика 22)

```bash
# 1. Клонировать репозиторий
git clone <ссылка на репозиторий>
cd kr3.2sem_22

# 2. Запустить через Docker Compose
docker compose up --build

# 3. Открыть в браузере
# http://localhost/
```

> **Требования:** Docker Desktop, WSL 2

---

## 👨‍💻 Автор

**Чувилов Александр Александрович**

Студент группы · ИПТИП · 4 семестр, 2025/2026