"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import BottomNav from "@/components/nav/BottomNav";
import {
  getCalendarEvents,
  deleteCalendarEvent,
  getEventsByMonth,
} from "@/lib/calendarStorage";
import type { CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 이벤트 로드 함수
  const loadEvents = React.useCallback(() => {
    const monthEvents = getEventsByMonth(year, month);
    setEvents(monthEvents);
  }, [year, month]);

  // 이벤트 로드
  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 전역 이벤트 리스너로 스토리지 변경 감지
  React.useEffect(() => {
    const handleStorageChange = () => {
      loadEvents();
    };

    window.addEventListener("storage", handleStorageChange);
    // 같은 탭에서의 변경도 감지하기 위해 커스텀 이벤트 사용
    window.addEventListener("calendar-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("calendar-updated", handleStorageChange);
    };
  }, [loadEvents]);

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
      deleteCalendarEvent(eventId);
      loadEvents();
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
    
    return events.filter((event) => {
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

      {/* 캘린더 그리드 */}
      <div className="rounded-lg border bg-white p-4">
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

      {/* 이벤트 목록 */}
      <div className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">
          {formatDate(currentDate)} 일정
        </h3>
        {events.length === 0 ? (
          <p className="text-center text-gray-500">저장된 일정이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {events
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() -
                  new Date(b.startDate).getTime()
              )
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="font-medium">{event.title}</div>
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
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">일정 상세</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
            <div className="mt-6 flex gap-2">
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
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

