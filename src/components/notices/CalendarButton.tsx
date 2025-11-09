import * as React from "react";
import type { Notice } from "@/types/notices";
import { Button } from "@/components/ui/button";

/**
 * 캘린더 추가 버튼
 * - notice.qualification_ai.application_deadline 이 유효한 날짜면 버튼 노출
 * - 클릭 시 onAddEvent(new Date(deadline)) 호출
 */
export function CalendarButton({
  notice,
  onAddEvent,
  label = "내 캘린더에 추가",
}: {
  notice: Notice | undefined;
  onAddEvent: (eventDate: Date) => void;
  label?: string;
}) {
  const deadlineStr = (notice as any)?.qualification_ai?.application_deadline as
    | string
    | undefined;

  // 날짜 유효성 검사
  const eventDate =
    typeof deadlineStr === "string" ? new Date(deadlineStr) : null;
  const isValid =
    !!eventDate && !Number.isNaN(eventDate.getTime()) && deadlineStr?.length;

  if (!isValid) return null;

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => onAddEvent(eventDate!)}
      aria-label="일정을 내 캘린더에 추가"
      title="일정을 내 캘린더에 추가"
    >
      📅 {label}
    </Button>
  );
}
