// src/types/notices.ts

// 공지 작성자 정보
export interface NoticeAuthor {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

// 공지 상태
export type NoticeStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

// 적합도 표시에 사용
export type Eligibility = 'ELIGIBLE' | 'BORDERLINE' | 'INELIGIBLE';

export interface NoticeQualificationAIKeyDate {
  key_date_type?: string | null;
  key_date?: string | null;
  keyDateType?: string | null;
  keyDate?: string | null;
  type?: string | null;
  label?: string | null;
  iso?: string | null;
  key_date_iso?: string | null;
  text?: string | null;
  value?: string | null;
  type_label?: string | null;
}

export interface NoticeQualificationAI {
  target_audience_raw?: string | null;
  target_audience?: string | null;
  key_date_type?: string | null;
  key_date?: string | null;
  keyDateType?: string | null;
  keyDate?: string | null;
  key_dates?: NoticeQualificationAIKeyDate[] | null;
  keyDates?: NoticeQualificationAIKeyDate[] | null;
  grade_years?: string | null;
  gpa?: string | null;
  language?: string | null;
  qualifications?: Record<string, any> | null;
  [key: string]: unknown;
}

// 프로젝트 내에서 사용하는 공지 타입
export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  body_html?: string;
  raw_text: string;
  url?: string;                  // 공지 원본 URL
  college_key?: string;          // 단과대 키 (colleges 테이블 참조)
  status: NoticeStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  author?: NoticeAuthor;
  qualification_ai: NoticeQualificationAI | null;
  start_at_ai?: string | null;   // 일정 시작일 (ISO)
  end_at_ai?: string | null;     // 일정 종료일 (ISO)

  // UI 표시 필드
  read: boolean;                 // 읽음 여부
  hashtags_ai?: string[];        // 대분류 배열 (예: ["#학사"])
  detailed_hashtags?: string[];  // 소분류 배열 (예: ["#수강신청"])
  source_college?: string;       // 출처(단과대/부서 등) - deprecated: college_key 사용
  posted_at?: string;            // 공지 게시 시각(ISO)
  eligibility?: Eligibility;     // 적합도 점 표시
  suitability?: string | null;   // 추천 적합도(맞춤 추천용)
  reason?: string | null;        // 추천 사유(맞춤 추천용)
}

// Notice를 사용하는 코드와의 호환을 위한 별칭
export type Notice = NoticeItem;

// 적합도 결과 타입
export interface NoticeEligibilityResult {
  noticeId: string;
  eligibility: Eligibility | null;
  checkedAt?: string;   // 분석 시각
  reasons?: string[];   // 판단 사유 목록 (호환성용)
  reasons_human?: string[];
  criteria_results?: {
    pass?: string[];
    fail?: string[];
    verify?: string[];
  };
  missing_info?: string[];
  reason_codes?: string[];
  suitable?: boolean;
  raw?: unknown;
}

// 제네릭 페이지네이션 응답
export interface PagedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// PagedResponse 별칭 (라우트에서 Paginated를 임포트하는 코드 호환)
export type Paginated<T> = PagedResponse<T>;

// 공지 목록 응답 별칭
export type NoticesResponse = PagedResponse<NoticeItem>;
