const fetch = require('isomorphic-fetch');

const store = {
  todos: [
    {
      id: 0,
      text: 'Go to the shops',
      complete: false,
    },
    {
      id: 1,
      text: 'Pick up the kids',
      complete: true,
    },
    {
      id: 2,
      text: 'Install urql',
      complete: false,
    },
  ],
};

const typeDefs = `
  type Query {
    todos: [Todo]
    pagedTodos(first: Int!, cursor: Int): PagedTodos
  }
  type Mutation {
    toggleTodo(id: ID!): Todo
  }
  type Todo {
    id: ID,
    text: String,
    complete: Boolean,
  }
  type PagedTodos {
    todos: [Todo]
    cursor: Int
  }
`;

const resolvers = {
  Query: {
    todos: (root, args, context) => {
      return store.todos;
    },
    pagedTodos: (root, args, context) => {
      console.log(args.cursor);
      const cursor = args.cursor || 0;
      return {
        cursor: cursor + args.first,
        todos: store.todos.slice(cursor, cursor + args.first),
      };
    },
  },
  Mutation: {
    toggleTodo: (root, args, context) => {
      const { id } = args;
      store.todos[args.id].complete = !store.todos[args.id].complete;
      return store.todos[args.id];
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
  context: (headers, secrets) => {
    return {
      headers,
      secrets,
    };
  },
};
