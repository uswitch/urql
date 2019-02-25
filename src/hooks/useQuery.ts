import { DocumentNode } from 'graphql';
import { useCallback, useContext, useEffect, useState } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context } from '../context';
import { RequestPolicy } from '../types';
import { CombinedError, createRequest } from '../utils';

interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  fetchOnChange?: boolean;
}

interface ExecuteQueryArgs<T, V> {
  variables?: V;
  requestPolicy?: RequestPolicy;
  /** Appends data rather than replacing query & data */
  appendResolver?: (data: T) => T;
}

interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}

type UseQueryResponse<T, V> = [
  UseQueryState<T>,
  (args: ExecuteQueryArgs<T, V>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T, V> => {
  const unsubFuncs: Array<() => void> = [];
  const client = useContext(Context);
  const request = createRequest(args.query, args.variables as any);

  const [initial, setInitial] = useState(true);
  const [state, setState] = useState<UseQueryState<T>>({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const executeQuery = useCallback(
    (opts: ExecuteQueryArgs<T, V> = {}) => {
      if (opts.appendResolver === undefined) {
        unsubscribe(unsubFuncs);
      }

      setState(s => ({ ...s, fetching: true }));
      const variables = opts.variables || request.variables;
      const resolver = opts.appendResolver ? opts.appendResolver : (s: T) => s;

      const [teardown] = pipe(
        client.executeQuery(createRequest(request.query, variables), {
          requestPolicy: args.requestPolicy,
          ...opts,
        }),
        subscribe(({ data, error }) =>
          setState({ fetching: false, data: resolver(data), error })
        )
      );

      unsubFuncs.push(teardown);
    },
    [request.key]
  );

  useEffect(() => {
    if (initial || args.fetchOnChange !== false) {
      executeQuery();
      setInitial(false);
    }
    return () => unsubscribe(unsubFuncs);
  }, [request.key]);

  return [state, executeQuery];
};

const unsubscribe = (unsubFuncs: Array<() => void>) =>
  unsubFuncs.forEach(unsub => unsub());
