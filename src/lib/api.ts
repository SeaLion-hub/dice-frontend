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

// 에러 응답 인터셉터 - 구조화된 에러 형식으로 변환
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 백엔드의 구조화된 에러 응답이 있는 경우 그대로 전달
    if (err?.response?.data?.error) {
      // eslint-disable-next-line no-console
      console.error('[DICE API ERROR]', {
        url: err?.config?.url,
        method: err?.config?.method,
        status: err?.response?.status,
        error_code: err?.response?.data?.error?.code,
        message: err?.response?.data?.error?.message,
      });
      return Promise.reject(err);
    }

    // 네트워크 에러 또는 기타 에러
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
