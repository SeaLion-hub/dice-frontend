import * as React from "react";
import type { Notice } from "@/types/notices";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/useCalendarStore";

/**
 * 캘린더 추가 버튼
 * - notice.start_at_ai 또는 end_at_ai가 있을 때만 버튼 노출
 * - 클릭 시 로컬 스토리지에 저장하고 성공 메시지 표시
 */
export function CalendarButton({
  notice,
  label = "내 캘린더에 추가",
}: {
  notice: Notice | undefined;
  label?: string;
}) {
  const [saved, setSaved] = React.useState(false);
  const addEvent = useCalendarStore((state) => state.addEvent);

  if (!notice) return null;

  // start_at_ai 또는 end_at_ai가 있어야 함
  const startAtStr = notice.start_at_ai;
  const endAtStr = notice.end_at_ai;

  if (!startAtStr && !endAtStr) return null;

  // 날짜 유효성 검사 및 파싱
  const startDate = startAtStr ? new Date(startAtStr) : null;
  const endDate = endAtStr ? new Date(endAtStr) : null;

  const isValidStart = startDate && !Number.isNaN(startDate.getTime());
  const isValidEnd = endDate && !Number.isNaN(endDate.getTime());

  // 시작일 또는 종료일 중 하나라도 유효해야 함
  if (!isValidStart && !isValidEnd) return null;

  // 시작일이 없으면 종료일을 시작일로 사용
  const eventStartDate = isValidStart ? startDate! : endDate!;
  const eventEndDate = isValidEnd ? endDate : null;

  const handleClick = () => {
    const result = addEvent({
      noticeId: notice.id,
      title: notice.title || "공지사항",
      startDate: eventStartDate,
      endDate: eventEndDate,
      source: "manual",
    });

    if (result.status === "duplicate") {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Button
      type="button"
      variant={saved ? "default" : "secondary"}
      size="sm"
      onClick={handleClick}
      aria-label="일정을 내 캘린더에 추가"
      title="일정을 내 캘린더에 추가"
    >
      {saved ? "✓ 저장됨" : "📅 " + label}
    </Button>
  );
}
