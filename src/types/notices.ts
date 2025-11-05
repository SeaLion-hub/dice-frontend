// 공지의 자격요건 분석 결과
export type QualificationAI = {
  grade_years?: string; // 예: "2~7학기"
  gpa?: string;         // 예: "3.0/4.3 이상"
  language?: string;    // 예: "TOEIC 850+"
  key_date?: string;    // 마감/면접일 등 (있을 수도 있고 없을 수도 있음)
};

// 공지 한 건
export type NoticeItem = {
  id: number | string;
  title: string;
  source_college?: string;
  posted_at?: string;        // "2025-10-28T02:10:00Z"
  category_ai?: string;      // "#학사", "#장학" 등
  qualification_ai?: QualificationAI;

  // 추천 전용 필드
  suitability?: "eligible" | "check" | "ineligible";
  suitability_score?: number; // 서버에서 0~1 사이 점수로 줄 수 있음
  reason?: string;            // "학점 미달 (요구:3.5 / 현재:3.0)" 등

  // 읽음 여부 - 프론트 로컬에서 쓸 수 있는 선택적 값
  read?: boolean;
};

// 페이징 응답
export type PagedResponse<T> = {
  items: T[];
  next_offset?: number | null;
};
