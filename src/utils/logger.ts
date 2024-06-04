import path from 'node:path';
import util from 'node:util';
import { env } from 'bun';
import { type TransformableInfo } from 'logform';
import { createLogger, format, transports } from 'winston';

const splat = Symbol.for('splat');
interface ITransformableInfoExtended extends TransformableInfo {
  timestamp: string;
  [splat]?: string;
}

const { combine, timestamp, printf, errors, json, colorize } = format;
const isProd = env.NODE_ENV === 'production';
const jsonStr = (payload: object) => JSON.stringify(payload, null, ' ');

const utilFormatter = () => ({
  transform(info: TransformableInfo) {
    const data = info as ITransformableInfoExtended;
    const args = data[splat];

    if (args) {
      info.args = util.inspect(args[0], {
        depth: 10,
        colors: true,
        compact: false,
        breakLength: 120
      });
    }

    return info;
  }
});

const formattingDate = (timestamp: string) =>
  timestamp.slice(0, 19).replace('T', ' ');

const devTransport = new transports.Console({
  format: combine(
    colorize(),
    utilFormatter(),
    printf(({ timestamp, level, message, args }) => {
      const payload = args as string;
      return `\n${formattingDate(timestamp)} ${level} ${message}\n ${
        payload || ''
      }`;
    })
  )
});

const emojiDecoration = (level: string) => {
  switch (level) {
    case 'warn':
      return '🔔 warn:';
    case 'error':
      return '🆘 error:';
    default:
      return '📚 info:';
  }
};

const outputArgs = async (args: Partial<TransformableInfo>) => {
  if (Object.keys(args).length && args.method) {
    return jsonStr({
      method: args.method,
      headers: args.headers,
      body: args.body
    });
  }

  if (Object.keys(args).length) return jsonStr({ ...args });

  return '';
};

const outputInfo = (info: ITransformableInfoExtended) => {
  const { timestamp, level, message, ...args } = info;

  return `${env.pm_id || ''} ${emojiDecoration(level)} ${formattingDate(
    timestamp
  )}, ${message} ${outputArgs(args)}`;
};

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: combine(
    json(),
    errors({ stack: true }),
    timestamp(),
    printf((printfData) => {
      const data = printfData as ITransformableInfoExtended;
      return outputInfo(data);
    })
  ),
  transports: [
    new transports.File({
      filename: path.resolve('errors/error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.resolve('errors/combined.log')
    }),
    devTransport
  ]
});

export const stream = {
  write: (message: string): void => {
    logger.info(message);
  }
};

export default logger;
