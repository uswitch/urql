import React, { FC, useCallback, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'urql';
import { Error, Loading, Todo } from './components';

interface QueryResponse {
  pagedTodos: {
    todos: Array<{
      id: number;
      text: string;
    }>;
    cursor: number;
  };
}

export const Home: FC = () => {
  const [res, executeQuery] = useQuery<QueryResponse>({
    query: TodoQuery,
    variables: { first: 1 },
    fetchOnChange: false,
  });

  const getContent = () => {
    if (res.data === undefined || res.fetching) {
      return <Loading />;
    }

    if (res.error) {
      return <Error>{res.error.message}</Error>;
    }

    console.log(res);

    return (
      <>
        <ul>
          {res.data.pagedTodos.todos.map(todo => (
            <Todo key={todo.id} {...todo} />
          ))}
        </ul>
        <button onClick={getNextTodos}>Load more</button>
      </>
    );
  };

  const resolver = (newData: QueryResponse) => ({
    pagedTodos: {
      todos: [...res.data.pagedTodos.todos, ...newData.pagedTodos.todos],
      cursor: newData.pagedTodos.cursor,
    },
  });

  const getNextTodos = () => {
    console.log(res.data);
    executeQuery({
      appendResolver: resolver,
      variables: { first: 1, cursor: res.data.pagedTodos.cursor },
    });
  };

  return <>{getContent()}</>;
};

const TodoQuery = gql`
  query($first: Int!, $cursor: Int) {
    pagedTodos(first: $first, cursor: $cursor) {
      todos {
        id
        text
        complete
      }
      cursor
    }
  }
`;
