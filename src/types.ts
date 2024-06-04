import { type Static, t } from 'elysia';

export const models = t.Union([
  t.Literal('gemma-7b-it'),
  t.Literal('llama3-8b-8192'),
  t.Literal('llama3-70b-8192'),
  t.Literal('mixtral-8x7b-32768')
]);

export const userRole = t.Union([
  t.Literal('user'),
  t.Literal('assistant')
  /* Legacy API? */
  // t.Literal('system')
]);

export const modelsContextLength: Record<Static<typeof models>, number> = {
  'gemma-7b-it': 8192,
  'llama3-8b-8192': 8192,
  'llama3-70b-8192': 8192,
  'mixtral-8x7b-32768': 32768
};

export const JsonResponseChoice = t.Object({
  index: t.Number(),
  delta: t.Object({
    content: t.String(),
    role: userRole
  }),
  finish_reason: t.Union([t.Literal('length'), t.Literal('stop'), t.Null()]),
  logprobs: t.Null()
});
export const JsonResponse = t.Object({
  id: t.String(),
  object: t.Union([t.Literal('chat.completion')]),
  created: t.Integer(),
  model: models,
  choices: t.Array(JsonResponseChoice)
});
