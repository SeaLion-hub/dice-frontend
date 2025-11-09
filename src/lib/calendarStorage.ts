// src/lib/calendarStorage.ts
import type { CalendarEvent, CalendarEventInput } from "@/types/calendar";

const STORAGE_KEY = "dice_calendar_events";

/**
 * 로컬 스토리지에서 모든 캘린더 이벤트를 가져옵니다.
 */
export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CalendarEvent[];
  } catch (error) {
    console.error("Failed to parse calendar events from localStorage:", error);
    return [];
  }
}

/**
 * 캘린더 이벤트를 저장합니다.
 */
export function saveCalendarEvent(input: CalendarEventInput): CalendarEvent {
  const events = getCalendarEvents();
  
  const newEvent: CalendarEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    noticeId: input.noticeId,
    title: input.title,
    startDate: input.startDate.toISOString(),
    endDate: input.endDate ? input.endDate.toISOString() : null,
    createdAt: new Date().toISOString(),
  };
  
  // 중복 체크 (같은 noticeId와 날짜가 있으면 스킵)
  const isDuplicate = events.some(
    (event) =>
      event.noticeId === newEvent.noticeId &&
      event.startDate === newEvent.startDate
  );
  
  if (!isDuplicate) {
    events.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    // 같은 탭에서의 변경 감지를 위한 이벤트 발생
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("calendar-updated"));
    }
  }
  
  return newEvent;
}

/**
 * 캘린더 이벤트를 삭제합니다.
 */
export function deleteCalendarEvent(eventId: string): boolean {
  const events = getCalendarEvents();
  const filtered = events.filter((event) => event.id !== eventId);
  
  if (filtered.length < events.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    // 같은 탭에서의 변경 감지를 위한 이벤트 발생
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("calendar-updated"));
    }
    return true;
  }
  
  return false;
}

/**
 * 특정 날짜 범위의 이벤트를 가져옵니다.
 */
export function getEventsByDateRange(
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const events = getCalendarEvents();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return events.filter((event) => {
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = event.endDate
      ? new Date(event.endDate).getTime()
      : eventStart;
    
    // 이벤트가 날짜 범위와 겹치는지 확인
    return (
      (eventStart >= start && eventStart <= end) ||
      (eventEnd >= start && eventEnd <= end) ||
      (eventStart <= start && eventEnd >= end)
    );
  });
}

/**
 * 특정 월의 이벤트를 가져옵니다.
 */
export function getEventsByMonth(year: number, month: number): CalendarEvent[] {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return getEventsByDateRange(startDate, endDate);
}

