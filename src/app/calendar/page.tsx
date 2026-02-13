"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { toast } from "sonner";

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = React.useState("");
  const [newEventEndDate, setNewEventEndDate] = React.useState("");
  const events = useCalendarStore((state) => state.events);
  const hydrate = useCalendarStore((state) => state.hydrate);
  const addEvent = useCalendarStore((state) => state.addEvent);
  const removeEvent = useCalendarStore((state) => state.removeEvent);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weekStart = React.useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    return date;
  }, [currentDate]);

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

  // 이전 기간으로 이동
  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      const newDate = new Date(weekStart);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  // 다음 기간으로 이동
  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      const newDate = new Date(weekStart);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
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

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setNewEventTitle("");
    setNewEventEndDate("");
  };

  // 새 일정 추가
  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate: Date | null = null;
    if (newEventEndDate) {
      endDate = new Date(newEventEndDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const result = addEvent({
      noticeId: `manual_${Date.now()}`,
      title: newEventTitle.trim(),
      startDate,
      endDate,
      source: "manual",
    });

    if (result.status === "duplicate") {
      toast.error("이미 등록된 일정입니다.");
      return;
    }

    setSelectedDate(null);
    setNewEventTitle("");
    setNewEventEndDate("");
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

  // 특정 날짜의 이벤트 가져오기 (시작일 또는 종료일만 표시)
  const getEventsForDate = (date: Date | null): Array<{ event: CalendarEvent; type: "start" | "end" }> => {
    if (!date) return [];
    const targetDateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const targetDateEnd = targetDateStart + 24 * 60 * 60 * 1000 - 1;

    const result: Array<{ event: CalendarEvent; type: "start" | "end" }> = [];

    monthEvents.forEach((event) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventStartDate = new Date(eventStart);
      const eventStartDay = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate()).getTime();
      
      // 시작일이 해당 날짜인지 확인
      if (eventStartDay >= targetDateStart && eventStartDay < targetDateEnd) {
        result.push({ event, type: "start" });
      }

      // 종료일이 있고, 시작일과 다른 경우 종료일도 확인
      if (event.endDate) {
        const eventEnd = new Date(event.endDate).getTime();
        const eventEndDate = new Date(eventEnd);
        const eventEndDay = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate()).getTime();
        
        // 종료일이 해당 날짜이고 시작일과 다른 경우만 추가
        if (eventEndDay >= targetDateStart && eventEndDay < targetDateEnd && eventStartDay !== eventEndDay) {
          result.push({ event, type: "end" });
        }
      }
    });

    return result;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    if (viewMode === "day") {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    } else if (viewMode === "week") {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })} ~ ${weekEnd.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      })}`;
    }
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
    });
  };

  // 요일 이름
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // 주간 뷰를 위한 날짜 배열
  const weekDays = React.useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  // 일간 뷰를 위한 이벤트 가져오기
  const dayEvents = React.useMemo(() => {
    const targetDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    const targetDateEnd = targetDateStart + 24 * 60 * 60 * 1000 - 1;

    return events.filter((event) => {
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = event.endDate ? new Date(event.endDate).getTime() : eventStart;
      return (
        (eventStart >= targetDateStart && eventStart < targetDateEnd) ||
        (eventEnd >= targetDateStart && eventEnd < targetDateEnd) ||
        (eventStart < targetDateStart && eventEnd >= targetDateEnd)
      );
    });
  }, [events, currentDate]);

  return (
    <main className="mx-auto mb-20 max-w-4xl px-4 py-6">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">캘린더</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`rounded px-3 py-1 text-sm ${
                viewMode === "month" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600"
              }`}
            >
              <CalendarIcon className="inline h-4 w-4 mr-1" />
              월
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`rounded px-3 py-1 text-sm ${
                viewMode === "week" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600"
              }`}
            >
              주
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`rounded px-3 py-1 text-sm ${
                viewMode === "day" ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-600"
              }`}
            >
              <List className="inline h-4 w-4 mr-1" />
              일
            </button>
          </div>
          <Button onClick={goToToday} variant="outline" size="sm">
            오늘
          </Button>
        </div>
      </header>

      {/* 네비게이션 */}
      <div className="mb-4 flex items-center justify-between rounded-lg border bg-white p-4">
        <button
          onClick={goToPrevious}
          className="rounded p-2 hover:bg-gray-100"
          aria-label={`이전 ${viewMode === "month" ? "달" : viewMode === "week" ? "주" : "일"}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
        <button
          onClick={goToNext}
          className="rounded p-2 hover:bg-gray-100"
          aria-label={`다음 ${viewMode === "month" ? "달" : viewMode === "week" ? "주" : "일"}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 주간 뷰 */}
      {viewMode === "week" && (
        <div className="rounded-lg border bg-white p-4">
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
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(date);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border p-2 ${
                    isToday ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white"
                  } cursor-pointer hover:bg-gray-50`}
                  onClick={() => handleDateClick(date)}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(({ event, type }) => (
                      <div
                        key={`${event.id}-${type}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className={`cursor-pointer truncate rounded px-1 py-0.5 text-[10px] hover:opacity-80 ${
                          type === "start"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                        title={`${event.title} (${type === "start" ? "시작일" : "마감일"})`}
                      >
                        {type === "start" ? "▶ " : "◀ "}
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 일간 뷰 */}
      {viewMode === "day" && (
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </h3>
          </div>
          <div className="space-y-2">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">이 날짜에는 일정이 없습니다.</p>
            ) : (
              dayEvents.map((event) => {
                const eventStart = new Date(event.startDate);
                const isStart = eventStart.toDateString() === currentDate.toDateString();
                const isEnd = event.endDate && new Date(event.endDate).toDateString() === currentDate.toDateString();

                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`cursor-pointer rounded-lg border p-3 hover:bg-gray-50 ${
                      isStart ? "border-l-4 border-l-green-500" : isEnd ? "border-l-4 border-l-red-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isStart && <span className="text-green-600 font-semibold">▶</span>}
                      {isEnd && <span className="text-red-600 font-semibold">◀</span>}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.startDate).toLocaleString("ko-KR", {
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {event.endDate &&
                            ` ~ ${new Date(event.endDate).toLocaleString("ko-KR", {
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Button
              onClick={() => handleDateClick(currentDate)}
              className="w-full mt-4"
              variant="outline"
            >
              이 날짜에 일정 추가
            </Button>
          </div>
        </div>
      )}

      {/* 월간 뷰 - 캘린더 그리드 (데스크톱) */}
      {viewMode === "month" && (
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
                } ${isToday ? "ring-2 ring-blue-500" : ""} ${
                  isCurrentMonth ? "cursor-pointer hover:bg-gray-50" : ""
                }`}
                onClick={() => isCurrentMonth && handleDateClick(date)}
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
                      {dayEvents.slice(0, 2).map(({ event, type }) => (
                        <div
                          key={`${event.id}-${type}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`cursor-pointer truncate rounded px-1 py-0.5 text-[10px] hover:opacity-80 ${
                            type === "start"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                          title={`${event.title} (${type === "start" ? "시작일" : "마감일"})`}
                        >
                          {type === "start" ? "▶ " : "◀ "}
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
      )}

      {/* 모바일 뷰 */}
      <div className="md:hidden">
        {viewMode === "week" && (
          <div className="rounded-lg border bg-white p-4">
            <div className="space-y-3">
              {weekDays.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDate(date);
                return (
                  <div
                    key={date.toDateString()}
                    className={`rounded-lg border p-3 ${isToday ? "border-blue-500 bg-blue-50" : ""}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium text-gray-900">
                        {date.toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </div>
                      {isToday && <span className="text-xs text-blue-600 font-medium">오늘</span>}
                    </div>
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-gray-400">일정 없음</p>
                    ) : (
                      <div className="space-y-1">
                        {dayEvents.map(({ event, type }) => (
                          <button
                            key={`${event.id}-${type}`}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left rounded px-2 py-1 text-xs ${
                              type === "start"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {type === "start" ? "▶ " : "◀ "}
                            {event.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {viewMode === "day" && (
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              {currentDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </h3>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">이 날짜에는 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => {
                  const eventStart = new Date(event.startDate);
                  const isStart = eventStart.toDateString() === currentDate.toDateString();
                  const isEnd = event.endDate && new Date(event.endDate).toDateString() === currentDate.toDateString();

                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left rounded-lg border p-3 ${
                        isStart ? "border-l-4 border-l-green-500" : isEnd ? "border-l-4 border-l-red-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isStart && <span className="text-green-600 font-semibold">▶</span>}
                        {isEnd && <span className="text-red-600 font-semibold">◀</span>}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.startDate).toLocaleString("ko-KR", {
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {event.endDate &&
                              ` ~ ${new Date(event.endDate).toLocaleString("ko-KR", {
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Button
              onClick={() => handleDateClick(currentDate)}
              className="w-full mt-4"
              variant="outline"
            >
              이 날짜에 일정 추가
            </Button>
          </div>
        )}
        {viewMode === "month" && (
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
        )}
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
                  {!event.noticeId.startsWith("manual_") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/notices/${event.noticeId}`)}
                    >
                      보기
                    </Button>
                  )}
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
              {selectedEvent.noticeId.startsWith("manual_") ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteEvent(selectedEvent.id);
                  }}
                >
                  삭제
                </Button>
              ) : (
                <>
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
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 일정 추가 모달 */}
      {selectedDate && (
        <Dialog
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDate(null);
              setNewEventTitle("");
              setNewEventEndDate("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>일정 추가</DialogTitle>
              <DialogDescription>
                {selectedDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                일정을 추가합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-title">제목 *</Label>
                <Input
                  id="event-title"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="일정 제목을 입력하세요"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="event-start-date">시작일</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="event-end-date">종료일 (선택사항)</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={newEventEndDate}
                  onChange={(e) => setNewEventEndDate(e.target.value)}
                  min={selectedDate.toISOString().split("T")[0]}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate(null);
                  setNewEventTitle("");
                  setNewEventEndDate("");
                }}
              >
                취소
              </Button>
              <Button onClick={handleAddEvent}>추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <BottomNav />
    </main>
  );
}

