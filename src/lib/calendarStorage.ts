// src/lib/calendarStorage.ts
import type { CalendarEvent } from "@/types/calendar";

const STORAGE_KEY = "dice_calendar_events";

/**
 * 로컬 스토리지에서 모든 캘린더 이벤트를 가져옵니다.
 */
export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as CalendarEvent[]).map((event) => ({
      ...event,
      source: event.source ?? "manual",
    }));
  } catch (error) {
    console.error("Failed to parse calendar events from localStorage:", error);
    return [];
  }
}

export function setCalendarEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Failed to write calendar events to localStorage:", error);
  }
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

