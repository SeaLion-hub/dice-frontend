// src/types/notices.ts

// ===== 페이지 상태 관련 타입 =====
export type NoticeTab = 'all' | 'my';

// [변경] 백엔드 규격에 맞춰 created_at/popular → recent/oldest
export type NoticeSort = 'recent' | 'oldest';

export type NoticeDateRange = 'all' | '1d' | '1w' | '1m';

export interface NoticeFilters {
  category?: string;
  sourceCollege?: string;
  dateRange?: NoticeDateRange;
}

// ===== 공지/자격 타입 =====
export type NoticeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface NoticeAuthor {
  id: string;
  name: string;
}

// 프로젝트 내에서 사용하는 공지 타입
export interface NoticeItem {
  id: string;
  title: string;
  body: string;                 // 기존 필드 유지
  raw_text: string;             // 정제된 본문 텍스트
  status: NoticeStatus;
  createdAt: string;            // ISO datetime
  updatedAt: string;            // ISO datetime
  tags?: string[];
  author?: NoticeAuthor;
  qualification_ai: Record<string, any> | null; // 캘린더 일정 추출용
}

export type Eligibility = 'ELIGIBLE' | 'BORDERLINE' | 'INELIGIBLE';

export interface NoticeEligibilityResult {
  noticeId: string;
  eligibility: Eligibility;
  reason: string;
  checkedAt: string; // ISO datetime
}

export interface Paginated<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

// 하위 호환: Notice 별칭
export type Notice = NoticeItem;
