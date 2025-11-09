"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BottomNav from "@/components/nav/BottomNav";
import type { CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCalendarStore } from "@/stores/useCalendarStore";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const events = useCalendarStore((state) => state.events);
  const hydrate = useCalendarStore((state) => state.hydrate);
  const removeEvent = useCalendarStore((state) => state.removeEvent);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  const monthEvents = React.useMemo(() => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    return events.filter((event) => {
      const start = new Date(event.startDate).getTime();
      const end = event.endDate ? new Date(event.endDate).getTime() : start;
      return (
        (start >= startMs && start <= endMs) ||
        (end >= startMs && end <= endMs) ||
        (start <= startMs && end >= endMs)
      );
    });
  }, [events, year, month]);

  const sortedMonthEvents = React.useMemo(
    () =>
      [...monthEvents].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ),
    [monthEvents]
  );

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 이벤트 삭제
  const handleDeleteEvent = (eventId: string) => {
    if (confirm("이 일정을 삭제하시겠습니까?")) {
      removeEvent(eventId);
      setSelectedEvent(null);
    }
  };

  // 캘린더 그리드 생성
  const calendarDays = React.useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    // 6주 * 7일 = 42일
    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [year, month]);

  // 특정 날짜의 이벤트 가져오기 (시작일 또는 종료일이 해당 날짜에 포함되는 이벤트)
  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const targetDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const targetDateEnd = targetDateStart + 24 * 60 * 60 * 1000 - 1;

    return monthEvents.filter((event) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = event.endDate
        ? new Date(event.endDate).getTime()
        : eventStart;

      // 이벤트가 해당 날짜와 겹치는지 확인
      return (
        (eventStart >= targetDateStart && eventStart < targetDateEnd) ||
        (eventEnd >= targetDateStart && eventEnd < targetDateEnd) ||
        (eventStart < targetDateStart && eventEnd >= targetDateEnd)
      );
    });
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
    });
  };

  // 요일 이름
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <main className="mx-auto mb-20 max-w-4xl px-4 py-6">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">캘린더</h1>
        <Button onClick={goToToday} variant="outline" size="sm">
          오늘
        </Button>
      </header>

      {/* 월 네비게이션 */}
      <div className="mb-4 flex items-center justify-between rounded-lg border bg-white p-4">
        <button
          onClick={goToPreviousMonth}
          className="rounded p-2 hover:bg-gray-100"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
        <button
          onClick={goToNextMonth}
          className="rounded p-2 hover:bg-gray-100"
          aria-label="다음 달"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 캘린더 그리드 (데스크톱) */}
      <div className="hidden rounded-lg border bg-white p-4 md:block">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date !== null;
            const isToday =
              date &&
              date.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(date);

            return (
              <div
                key={index}
                className={`min-h-[80px] border p-1 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium ${
                        isToday
                          ? "text-blue-600"
                          : isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="cursor-pointer truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700 hover:bg-blue-200"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-500">
                          +{dayEvents.length - 2}개
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 모바일 아젠다 뷰 */}
      <div className="md:hidden">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">이번 달 일정</h3>
          {sortedMonthEvents.length === 0 ? (
            <p className="text-sm text-gray-500">저장된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {sortedMonthEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span>{event.title}</span>
                    {event.source === "auto" && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        자동
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.startDate).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                    {event.endDate &&
                      ` ~ ${new Date(event.endDate).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                      })}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="mt-6 rounded-lg border bg-white p-4 md:block hidden">
        <h3 className="mb-4 text-lg font-semibold">
          {formatDate(currentDate)} 일정
        </h3>
        {sortedMonthEvents.length === 0 ? (
          <p className="text-center text-gray-500">저장된 일정이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {sortedMonthEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="font-medium flex items-center gap-2">
                    <span>{event.title}</span>
                    {event.source === "auto" && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        자동
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.startDate).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {event.endDate &&
                      ` ~ ${new Date(event.endDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/notices/${event.noticeId}`)}
                  >
                    보기
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 이벤트 상세 모달 */}
      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(open) => {
            if (!open) setSelectedEvent(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>일정 상세</DialogTitle>
              <DialogDescription>
                저장된 일정을 확인하고 관리할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">제목</div>
                <div className="mt-1">{selectedEvent.title}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">시작일</div>
                <div className="mt-1">
                  {new Date(selectedEvent.startDate).toLocaleDateString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>
              {selectedEvent.endDate && (
                <div>
                  <div className="text-sm font-medium text-gray-700">종료일</div>
                  <div className="mt-1">
                    {new Date(selectedEvent.endDate).toLocaleDateString(
                      "ko-KR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                className="flex-1"
                onClick={() => {
                  router.push(`/notices/${selectedEvent.noticeId}`);
                  setSelectedEvent(null);
                }}
              >
                공지 보기
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteEvent(selectedEvent.id);
                }}
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <BottomNav />
    </main>
  );
}

