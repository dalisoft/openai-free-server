import { encoding_for_model, get_encoding } from 'tiktoken';

const encoding = encoding_for_model('gpt-4-turbo');
export const getTokenCount = (input: string) => {
  const token = encoding.encode(input);
  encoding.free();
  return token.length;
};
