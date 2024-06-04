import swagger from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { chatApi } from './routes/chat';
import { modelsApi } from './routes/models';
import logger from './utils/logger';

const app = new Elysia({ prefix: '/v1' })
  .onError(({ code, error }) => {
    logger.error('onError', {
      code,
      error
    });

    return {
      status: 'error',
      code,
      error
    };
  })
  .use(
    swagger({
      documentation: {
        info: {
          title: 'OpenAI Free Server Documentation',
          version: '1.0.0'
        }
      }
    })
  )
  .use(chatApi)
  .use(modelsApi);

app.listen({
  hostname: '0.0.0.0',
  port: Number(process.env.SERVER_PORT),
  reusePort: true
});
console.log(`Listening at ${app.server?.port}`);
