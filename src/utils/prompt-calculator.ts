import { encoding_for_model, get_encoding } from 'tiktoken';

export const getTokenCount = (input: string) => {
  const encoding = encoding_for_model('gpt-4-turbo');
  const token = encoding.encode(input);
  encoding.free();

  return token.length;
};
