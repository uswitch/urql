import { DocumentNode } from 'graphql';
import { useCallback, useRef } from 'react';
import { pipe, onEnd, subscribe } from 'wonka';
import { useClient } from '../context';
import { OperationContext, RequestPolicy } from '../types';
import { CombinedError, noop } from '../utils';
import { useRequest } from './useRequest';
import { useImmediateEffect } from './useImmediateEffect';
import { useImmediateState } from './useImmediateState';

export interface UseQueryArgs<V> {
  query: string | DocumentNode;
  variables?: V;
  requestPolicy?: RequestPolicy;
  pollInterval?: number;
  context?: Partial<OperationContext>;
  pause?: boolean;
}

export interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
  extensions?: Record<string, any>;
}

export type UseQueryResponse<T> = [
  UseQueryState<T>,
  (opts?: Partial<OperationContext>) => void
];

export const useQuery = <T = any, V = object>(
  args: UseQueryArgs<V>
): UseQueryResponse<T> => {
  const unsubscribe = useRef(noop);
  const client = useClient();
  const prevRequest = useRef<undefined | GraphQLRequest>(undefined);

  // This is like useState but updates the state object
  // immediately, when we're still before the initial mount
  const [state, setState] = useImmediateState<UseQueryState<T>>({
    fetching: false,
    data: undefined,
    error: undefined,
    extensions: undefined,
  });

  const executeQuery = useCallback(
    (opts?: Partial<OperationContext>,
    variables: object = {}) => {
      // This creates a request which will keep a stable reference
      // if request.key doesn't change
      const request = createRequest(args.query, ({...args.variables, ...variables} || {}));
      if (prevRequest.current && prevRequest.current.key === request.key) return;
      prevRequest.current = request;

      unsubscribe.current();

      setState(s => ({ ...s, fetching: true }));

      [unsubscribe.current] = pipe(
        client.executeQuery(request, {
          requestPolicy: args.requestPolicy,
          pollInterval: args.pollInterval,
          ...args.context,
          ...opts,
        }),
        onEnd(() => setState(s => ({ ...s, fetching: false }))),
        subscribe(({ data, error, extensions }) => {
          setState({ fetching: false, data, error, extensions });
        })
      );
    },
    [
      args.context,
      args.query,
      args.variables,
      args.requestPolicy,
      args.pollInterval,
      client,
      setState,
    ]
  );

  useImmediateEffect(() => {
    if (args.pause) {
      unsubscribe.current();
      setState(s => ({ ...s, fetching: false }));
      return noop;
    }

    executeQuery();
    return () => unsubscribe.current(); // eslint-disable-line
  }, [executeQuery, args.pause, setState]);

  return [state, executeQuery];
};
