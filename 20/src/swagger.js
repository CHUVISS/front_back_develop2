const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Users API',
      version: '1.0.0',
      description: 'REST API для управления пользователями — Практическое занятие 20',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '664f1a2b3c4d5e6f7a8b9c0d',
              description: 'Уникальный идентификатор MongoDB',
            },
            first_name: {
              type: 'string',
              example: 'Иван',
              description: 'Имя пользователя',
            },
            last_name: {
              type: 'string',
              example: 'Иванов',
              description: 'Фамилия пользователя',
            },
            age: {
              type: 'integer',
              example: 25,
              description: 'Возраст пользователя',
            },
            created_at: {
              type: 'integer',
              example: 1716307499,
              description: 'Unix-время создания записи',
            },
            updated_at: {
              type: 'integer',
              example: 1716307499,
              description: 'Unix-время последнего обновления',
            },
          },
        },
        UserInput: {
          type: 'object',
          required: ['first_name', 'last_name', 'age'],
          properties: {
            first_name: {
              type: 'string',
              example: 'Иван',
            },
            last_name: {
              type: 'string',
              example: 'Иванов',
            },
            age: {
              type: 'integer',
              example: 25,
            },
          },
        },
        UserPatch: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              example: 'Пётр',
            },
            last_name: {
              type: 'string',
              example: 'Петров',
            },
            age: {
              type: 'integer',
              example: 30,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Пользователь не найден',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
