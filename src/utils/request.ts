import { DocumentNode } from 'graphql';
import { getKeyForRequest } from './keyForQuery';

type QueryType = string | DocumentNode;

export function createRequest<
  Q extends QueryType,
  T extends object | undefined
>(q: Q, vars?: T) {
  return {
    key: getKeyForRequest(q, vars),
    query: q,
    variables: vars || {},
  };
}
