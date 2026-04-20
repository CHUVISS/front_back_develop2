# Практическое занятие 19 — REST API + PostgreSQL

## Установка и запуск

```bash
npm install
node server.js
```

## Настройка подключения

Откройте `server.js` и измените параметры в блоке подключения:

```js
// Локально:
const sequelize = new Sequelize('mydatabase', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
});

// Облако (ElephantSQL):
// const sequelize = new Sequelize('postgres://user:pass@host:5432/db', { dialect: 'postgres' });
```

## Эндпоинты

| Метод  | Адрес            | Описание                        |
|--------|------------------|---------------------------------|
| POST   | /api/users       | Создать пользователя            |
| GET    | /api/users       | Получить всех пользователей     |
| GET    | /api/users/:id   | Получить пользователя по ID     |
| PATCH  | /api/users/:id   | Обновить данные пользователя    |
| DELETE | /api/users/:id   | Удалить пользователя            |

## Примеры запросов (curl)

```bash
# Создать пользователя
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Иван","last_name":"Иванов","age":25}'

# Получить всех
curl http://localhost:3000/api/users

# Получить по ID
curl http://localhost:3000/api/users/1

# Обновить
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age":26}'

# Удалить
curl -X DELETE http://localhost:3000/api/users/1
```

## Схема таблицы users

| Поле       | Тип       | Описание                         |
|------------|-----------|----------------------------------|
| id         | SERIAL PK | Уникальный идентификатор         |
| first_name | VARCHAR   | Имя                              |
| last_name  | VARCHAR   | Фамилия                          |
| age        | INTEGER   | Возраст                          |
| created_at | BIGINT    | Unix-время создания              |
| updated_at | BIGINT    | Unix-время последнего обновления |
