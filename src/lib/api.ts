// src/lib/api.ts
import axios from 'axios';

const BASE_URL =
  process.env.DICE_API_BASE_URL ??
  process.env.NEXT_PUBLIC_DICE_API_BASE_URL ?? // fallback if only public var exists
  process.env.NEXT_PUBLIC_API_BASE ?? // align with client-side fetches
  'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// (선택) 간단한 응답/에러 로깅 – 필요 없으면 제거 가능
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[DICE API ERROR]', {
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return Promise.reject(err);
  }
);
