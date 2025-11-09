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

// 프로젝트 내에서 사용하는 공지 타입
export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  raw_text: string;
  status: NoticeStatus;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  author?: NoticeAuthor;
  qualification_ai: Record<string, any> | null;

  // UI 표시 필드
  read: boolean;                 // 읽음 여부
  hashtags_ai?: string;          // 대분류 (예: "#학사")
  detailed_hashtags?: string[];  // 소분류 배열 (예: ["#수강신청"])
  source_college?: string;       // 출처(단과대/부서 등)
  posted_at?: string;            // 공지 게시 시각(ISO)
  eligibility?: Eligibility;     // 적합도 점 표시
}

// Notice를 사용하는 코드와의 호환을 위한 별칭
export type Notice = NoticeItem;

// 적합도 결과 타입
export interface NoticeEligibilityResult {
  noticeId: string;
  eligibility: Eligibility;
  checkedAt?: string;   // 분석 시각
  reasons?: string[];   // 판단 사유 목록
  // 필요 시 세부 필드 추가 가능
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
