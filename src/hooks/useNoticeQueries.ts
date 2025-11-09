// src/hooks/useNoticeQueries.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Notice, NoticeEligibilityResult } from '@/types/notices';
import { useNoticePreferences } from '@/hooks/useNoticePreferences';

/** 공지 상세 */
export const useNoticeDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['notice', id],
    queryFn: async () => {
      const res = await axios.get<Notice>(`/api/notices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

/** 자격 검증: GET → POST 로 전환 */
export const useNoticeEligibility = (id: string | null) => {
  const { token } = useNoticePreferences();

  return useQuery({
    queryKey: ['notice', id, 'eligibility'],
    queryFn: async () => {
      // POST 요청으로 변경, 빈 바디 전송
      const res = await axios.post<NoticeEligibilityResult>(
        `/api/notices/${id}/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    },
    enabled: !!id && !!token,
  });
};
