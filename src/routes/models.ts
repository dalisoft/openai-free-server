import Elysia, { t, type Static } from 'elysia';
import { API_HEADERS, API_MODELS_URL } from '../constants';
import { models } from '../types';

export const modelsApi = new Elysia({ prefix: '/models' })
  .get(
    '/',
    async () => {
      const response = await fetch(API_MODELS_URL, {
        method: 'POST',
        headers: API_HEADERS as never,
        body: JSON.stringify({ key: '' })
      });
      const data = await response.json();

      return {
        object: 'list' as const,
        data: data.map(({ id }: { id: Static<typeof models> }) => {
          return {
            id,
            object: 'model',
            created: Date.now(),
            owned_by: null
          };
        })
      };
    },
    {
      response: t.Object({
        object: t.Literal('list'),
        data: t.Array(
          t.Object({
            id: models,
            object: t.Literal('model'),
            created: t.Number(),
            owned_by: t.Union([t.String(), t.Null()])
          })
        )
      }),
      detail: {
        summary: 'Models list',
        tags: ['models']
      }
    }
  )
  .get(
    '/:model',
    async ({ params }) => {
      return {
        id: params.model,
        object: 'model',
        created: Date.now(),
        owned_by: null
      };
    },
    {
      params: t.Object({
        model: models
      }),
      response: t.Object({
        id: models,
        object: t.Literal('model'),
        created: t.Number(),
        owned_by: t.Union([t.String(), t.Null()])
      }),
      detail: {
        summary: 'Model show info',
        tags: ['models']
      }
    }
  );
