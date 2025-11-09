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

/** 자격 검증: GET → POST */
export const useNoticeEligibility = (id: string | null) => {
  const { token } = useNoticePreferences();

  return useQuery({
    queryKey: ['notice', id, 'eligibility'],
    queryFn: async () => {
      const res = await axios.post<NoticeEligibilityResult>(
        `/api/notices/${id}/verify`,
        {}, // POST라도 바디가 필요한 백엔드가 있어 빈 객체 전송
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
