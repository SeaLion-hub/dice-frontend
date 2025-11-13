// src/hooks/useApiError.ts
import { useCallback } from "react";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    status_code: number;
    details?: Record<string, unknown>;
    traceback?: string;
  };
}

/**
 * API 에러 응답을 파싱하고 사용자 친화적 메시지를 반환하는 훅
 */
export function useApiError() {
  /**
   * 에러 객체에서 사용자 친화적 메시지 추출
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    // 네트워크 에러
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return "네트워크 연결을 확인해주세요.";
    }

    // Response 객체가 있는 경우
    if (error && typeof error === "object" && "response" in error) {
      const response = (error as { response?: { data?: ApiErrorResponse; status?: number } })
        .response;

      if (response?.data?.error) {
        // 백엔드의 구조화된 에러 응답
        return response.data.error.message || "오류가 발생했습니다.";
      }

      // HTTP 상태 코드별 메시지
      const status = response?.status;
      if (status) {
        return getStatusMessage(status);
      }
    }

    // 일반 에러 객체
    if (error instanceof Error) {
      return error.message || "알 수 없는 오류가 발생했습니다.";
    }

    // 문자열
    if (typeof error === "string") {
      return error;
    }

    return "알 수 없는 오류가 발생했습니다.";
  }, []);

  /**
   * HTTP 상태 코드에 따른 사용자 친화적 메시지
   */
  const getStatusMessage = useCallback((status: number): string => {
    const statusMessages: Record<number, string> = {
      400: "잘못된 요청입니다. 입력값을 확인해주세요.",
      401: "로그인이 필요합니다.",
      403: "접근 권한이 없습니다.",
      404: "요청한 리소스를 찾을 수 없습니다.",
      409: "이미 존재하는 데이터입니다.",
      422: "입력 데이터 검증에 실패했습니다.",
      429: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      500: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      502: "서버에 연결할 수 없습니다.",
      503: "서비스를 일시적으로 사용할 수 없습니다.",
    };

    return statusMessages[status] || `오류가 발생했습니다. (${status})`;
  }, []);

  /**
   * 에러 코드에 따른 상세 메시지
   */
  const getErrorCodeMessage = useCallback((code: string): string => {
    const codeMessages: Record<string, string> = {
      VALIDATION_ERROR: "입력 데이터 검증에 실패했습니다.",
      DATABASE_ERROR: "데이터베이스 오류가 발생했습니다.",
      DATABASE_QUERY_ERROR: "데이터 조회 중 오류가 발생했습니다.",
      UNAUTHORIZED: "인증에 실패했습니다.",
      NOTICE_NOT_FOUND: "공지사항을 찾을 수 없습니다.",
      RATE_LIMIT_EXCEEDED: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
    };

    return codeMessages[code] || "오류가 발생했습니다.";
  }, []);

  /**
   * 에러 객체에서 에러 코드 추출
   */
  const getErrorCode = useCallback((error: unknown): string | null => {
    if (error && typeof error === "object" && "response" in error) {
      const response = (error as { response?: { data?: ApiErrorResponse } }).response;
      return response?.data?.error?.code || null;
    }
    return null;
  }, []);

  return {
    getErrorMessage,
    getStatusMessage,
    getErrorCodeMessage,
    getErrorCode,
  };
}

