import crypto from 'node:crypto';
import https from 'node:https';
import { Stream } from '@elysiajs/stream';
import { Elysia, type Static, t } from 'elysia';
import {
  API_BASE_URL,
  API_CHAT_URL,
  API_HEADERS,
  API_MODELS_URL
} from './constants';
import { PolyfillTextDecoderStream } from './polyfills/textdecoderstream';
import {
  JsonResponse,
  type JsonResponseChoice,
  models,
  modelsContextLength,
  userRole
} from './types';
import { getTokenCount, promptCalculator } from './utils/prompt-calculator';

const app = new Elysia()
  .post(
    '/v1/chat/completions',
    async ({ body }) => {
      const { model, temperature = 0.4, max_tokens = 1024, stream } = body;
      const modelContextLength = modelsContextLength[body.model];
      const id = crypto.randomUUID();

      const messages = body.messages.map(({ content }) => content).join('\n');
      const promptLength = getTokenCount(messages);

      if (promptLength + max_tokens >= modelContextLength) {
        const choice: Static<typeof JsonResponseChoice> = {
          index: 0,
          delta: { content: null, role: 'assistant' },
          finish_reason: 'length',
          logprobs: null
        };

        return {
          id,
          object: 'chat.completion',
          created: Date.now(),
          model: body.model,
          choices: [choice]
        } as Static<typeof JsonResponse>;
      }

      const response = await fetch(API_CHAT_URL, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({
          model: {
            id: model,
            name: model,
            maxLength: modelContextLength,
            tokenLimit: max_tokens
          },
          messages: body.messages,
          key: '',
          prompt:
            "You are a helpful, creative, clever, and very friendly assistant. You have to adapt your responses to the user's language style and preferences to make the interaction more personalized and engaging.",
          temperature
        })
      });

      if (stream) {
        const stream = new Stream();
        const contents = response.body?.pipeThrough(
          new PolyfillTextDecoderStream()
        );

        for await (const content of contents) {
          const choice: Static<typeof JsonResponseChoice> = {
            index: 0,
            delta: { content, role: 'assistant' },
            finish_reason: null,
            logprobs: null
          };
          stream.send({
            id,
            object: 'chat.completion',
            created: Date.now(),
            model: body.model,
            choices: [choice]
          });
        }
        stream.close();
        return stream;
      } else {
        const text = await response.text();

        const choice: Static<typeof JsonResponseChoice> = {
          index: 0,
          delta: { content: text, role: 'assistant' },
          finish_reason: null,
          logprobs: null
        };

        return {
          id,
          object: 'chat.completion',
          created: Date.now(),
          model: body.model,
          choices: [choice]
        } as Static<typeof JsonResponse>;
      }
    },
    {
      body: t.Object({
        model: models,
        max_tokens: t.Optional(t.Number()),
        temperature: t.Optional(t.Number()),
        messages: t.Array(
          t.Object({
            role: userRole,
            content: t.String()
          })
        ),
        stream: t.Optional(t.Boolean())
      })
    }
  )
  .get(
    '/v1/models',
    async () => {
      const response = await fetch(API_MODELS_URL, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify({ key: '' })
      });
      const data = await response.json();

      return {
        object: 'list',
        data: data.map(({ id }) => {
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
      })
    }
  )
  .get(
    '/v1/models/:model',
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
      })
    }
  );

await app.listen({
  hostname: '0.0.0.0',
  port: Number(3000),
  reusePort: true
});
