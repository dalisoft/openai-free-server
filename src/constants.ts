export const API_BASE_URL = `${process.env.API_URL}/api`;
export const API_CHAT_URL = `${API_BASE_URL}/chat`;
export const API_MODELS_URL = `${API_BASE_URL}/models`;

export const API_HEADERS = {
  Accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
  'Cache-Control': 'no-cache',
  'Content-Type': 'application/json',
  Origin: process.env.API_URL,
  Pragma: 'no-cache',
  priority: 'u=1, i',
  'sec-ch-ua':
    '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  Referer: process.env.API_URL,
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const;
