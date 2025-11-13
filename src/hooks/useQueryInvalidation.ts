// src/hooks/useQueryInvalidation.ts
import { useQueryClient } from "@tanstack/react-query";

/**
 * React Query 캐시 무효화를 위한 커스텀 훅
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  /**
   * 공지사항 관련 모든 쿼리 무효화
   */
  const invalidateNotices = () => {
    queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  /**
   * 특정 공지사항 상세 정보 무효화
   */
  const invalidateNoticeDetail = (noticeId: string | number) => {
    queryClient.invalidateQueries({ queryKey: ["notice", "detail", noticeId] });
  };

  /**
   * 공지사항 자격 분석 무효화
   */
  const invalidateNoticeEligibility = (noticeId: string | number) => {
    queryClient.invalidateQueries({ queryKey: ["notice", "eligibility", noticeId] });
  };

  /**
   * 추천 공지사항 무효화
   */
  const invalidateRecommended = () => {
    queryClient.invalidateQueries({ queryKey: ["recommended"] });
  };

  /**
   * 사용자 프로필 관련 쿼리 무효화 (프로필 업데이트 시)
   */
  const invalidateUserProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
    // 프로필 업데이트 시 추천 공지도 무효화
    invalidateRecommended();
  };

  /**
   * 모든 공지사항 관련 쿼리 무효화 (프로필 업데이트 시)
   */
  const invalidateAllNotices = () => {
    invalidateNotices();
    invalidateRecommended();
  };

  return {
    invalidateNotices,
    invalidateNoticeDetail,
    invalidateNoticeEligibility,
    invalidateRecommended,
    invalidateUserProfile,
    invalidateAllNotices,
  };
}

