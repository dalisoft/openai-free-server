import Stream from '@elysiajs/stream';
import Elysia, { t, type Static } from 'elysia';
import { API_CHAT_URL, API_HEADERS } from '../constants';
import { PolyfillTextDecoderStream } from '../polyfills/textdecoderstream';
import {
  type JsonResponse,
  type JsonResponseChoice,
  models,
  modelsContextLength,
  userRole
} from '../types';
import { getTokenCount } from '../utils/prompt-calculator';

export const chatApi = new Elysia({ prefix: '/chat' }).post(
  '/completions',
  async ({ body }) => {
    const { model, temperature = 0.4, max_tokens = 1024, stream } = body;
    const modelContextLength = modelsContextLength[body.model];
    const id = crypto.randomUUID();

    const messages = body.messages.map(({ content }) => content).join('\n');
    const promptLength = getTokenCount(messages);

    if (promptLength + max_tokens >= modelContextLength) {
      const choice: Static<typeof JsonResponseChoice> = {
        index: 0,
        delta: { content: 'Context length exceed', role: 'assistant' },
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
      headers: API_HEADERS as never,
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

    if (!response || !response.body) {
      const choice: Static<typeof JsonResponseChoice> = {
        index: 0,
        delta: { content: 'Empty body', role: 'assistant' },
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

    if (stream) {
      const stream = new Stream();
      const contents = response.body.pipeThrough<string>(
        new PolyfillTextDecoderStream()
      );

      // @ts-ignore
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
    body: t.Object(
      {
        model: models,
        max_tokens: t.Optional(t.Number({ default: 1024 })),
        temperature: t.Optional(t.Number({ default: 0.4 })),
        messages: t.Array(
          t.Object({
            role: userRole,
            content: t.String()
          })
        ),
        stream: t.Optional(t.Boolean({ default: false }))
      },
      {
        description: 'Expects a valid input as OpenAI parameters'
      }
    ),
    detail: {
      summary: 'Chat completion',
      tags: ['chat']
    }
  }
);
