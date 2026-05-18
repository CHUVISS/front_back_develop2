// server.js — Практика 26: GraphQL API для каталога книг (Apollo Server)

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// 1. СХЕМА (SDL — Schema Definition Language)
const typeDefs = `#graphql

  # Автор книги
  type Author {
    id: ID!
    name: String!
    bio: String
    # Вложенный резолвер: все книги этого автора
    books: [Book!]!
  }

  # Книга
  type Book {
    id: ID!
    title: String!
    year: Int!
    genre: String!
    # Вложенный резолвер: объект автора
    author: Author!
  }

  # ── Query: операции чтения ──
  type Query {
    # Получить все книги
    books: [Book!]!
    # Получить одну книгу по id
    book(id: ID!): Book
    # Получить всех авторов
    authors: [Author!]!
    # Получить одного автора по id
    author(id: ID!): Author
  }

  # Input-типы для мутаций (удобнее, чем перечислять аргументы)
  input CreateAuthorInput {
    name: String!
    bio: String
  }

  input CreateBookInput {
    title: String!
    year: Int!
    genre: String!
    authorId: ID!
  }

  # ── Mutation: операции изменения данных ──
  type Mutation {
    createAuthor(input: CreateAuthorInput!): Author!
    createBook(input: CreateBookInput!): Book!
  }
`;

// 2. ДАННЫЕ В ПАМЯТИ (имитация базы данных)
const authors = [
  { id: '1', name: 'Лев Толстой',       bio: 'Русский писатель, автор «Войны и мира»' },
  { id: '2', name: 'Фёдор Достоевский', bio: 'Русский писатель, мастер психологической прозы' },
  { id: '3', name: 'Михаил Булгаков',   bio: 'Русский писатель советской эпохи' },
];

const books = [
  { id: '1', title: 'Война и мир',            year: 1869, genre: 'Роман',         authorId: '1' },
  { id: '2', title: 'Анна Каренина',           year: 1878, genre: 'Роман',         authorId: '1' },
  { id: '3', title: 'Преступление и наказание',year: 1866, genre: 'Роман',         authorId: '2' },
  { id: '4', title: 'Идиот',                   year: 1869, genre: 'Роман',         authorId: '2' },
  { id: '5', title: 'Мастер и Маргарита',      year: 1967, genre: 'Фантастика',    authorId: '3' },
];

// 3. РЕЗОЛВЕРЫ
const resolvers = {

  // ── Query ──
  Query: {
    books: () => books,

    book: (_, { id }) => books.find(b => b.id === id) ?? null,

    authors: () => authors,

    author: (_, { id }) => authors.find(a => a.id === id) ?? null,
  },

  // ── Mutation ──
  Mutation: {
    createAuthor: (_, { input }) => {
      const author = {
        id: String(authors.length + 1),
        name: input.name,
        bio: input.bio ?? null,
      };
      authors.push(author);
      return author;
    },

    createBook: (_, { input }) => {
      const authorExists = authors.find(a => a.id === input.authorId);
      if (!authorExists) {
        throw new Error(`Автор с id=${input.authorId} не найден`);
      }
      const book = {
        id: String(books.length + 1),
        title: input.title,
        year: input.year,
        genre: input.genre,
        authorId: input.authorId,
      };
      books.push(book);
      return book;
    },
  },

  // ── Вложенные резолверы ──
  Book: {
    author: (parent) => authors.find(a => a.id === parent.authorId),
  },

  Author: {
    books: (parent) => books.filter(b => b.authorId === parent.id),
  },
};

// 4. ЗАПУСК СЕРВЕРА
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`
GraphQL сервер запущен: ${url}
Apollo Sandbox доступен по адресу: ${url}
`);
