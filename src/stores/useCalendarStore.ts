import { create } from "zustand";

import type { CalendarEvent, CalendarEventInput } from "@/types/calendar";
import type { Notice } from "@/types/notices";
import { getCalendarEvents, setCalendarEvents } from "@/lib/calendarStorage";

type AddEventResult =
  | { status: "added"; event: CalendarEvent }
  | { status: "duplicate"; event: CalendarEvent | null };

interface CalendarStoreState {
  events: CalendarEvent[];
  hydrate: () => void;
  addEvent: (input: CalendarEventInput) => AddEventResult;
  removeEvent: (id: string) => void;
  syncNoticeEvents: (notices: Notice[]) => void;
}

function normalizeEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    source: event.source ?? "manual",
  };
}

function generateEventId() {
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function buildEventKey(noticeId: string, startISO: string) {
  return `${noticeId}_${startISO}`;
}

function parseNoticeDates(notice: Notice) {
  const start = notice.start_at_ai ?? notice.end_at_ai ?? null;
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  let endISO: string | null = null;
  if (notice.end_at_ai) {
    const endDate = new Date(notice.end_at_ai);
    if (!Number.isNaN(endDate.getTime())) {
      endISO = endDate.toISOString();
    }
  }

  return {
    startISO: startDate.toISOString(),
    endISO,
  };
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => {
  const hydrate = () => {
    const stored = getCalendarEvents().map(normalizeEvent);
    set({ events: stored });
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === "dice_calendar_events") {
        hydrate();
      }
    });
  }

  return {
    events: typeof window === "undefined" ? [] : getCalendarEvents().map(normalizeEvent),

    hydrate,

    addEvent: (input) => {
      const existing = getCalendarEvents().map(normalizeEvent);
      const startISO = input.startDate.toISOString();
      const noticeId = String(input.noticeId);

      const duplicate = existing.find(
        (event) => event.noticeId === noticeId && event.startDate === startISO
      );

      if (duplicate) {
        return { status: "duplicate", event: duplicate };
      }

      const newEvent: CalendarEvent = {
        id: generateEventId(),
        noticeId,
        title: input.title,
        startDate: startISO,
        endDate: input.endDate ? input.endDate.toISOString() : null,
        createdAt: new Date().toISOString(),
        source: input.source ?? "manual",
      };

      const nextEvents = [...existing, newEvent];
      setCalendarEvents(nextEvents);
      set({ events: nextEvents });

      return { status: "added", event: newEvent };
    },

    removeEvent: (id) => {
      const existing = getCalendarEvents().map(normalizeEvent);
      const nextEvents = existing.filter((event) => event.id !== id);
      setCalendarEvents(nextEvents);
      set({ events: nextEvents });
    },

    syncNoticeEvents: (notices) => {
      if (!notices || notices.length === 0) return;

      const existing = getCalendarEvents().map(normalizeEvent);
      const eventKeys = new Set(existing.map((event) => buildEventKey(event.noticeId, event.startDate)));
      const additions: CalendarEvent[] = [];

      notices.forEach((notice) => {
        const parsed = parseNoticeDates(notice);
        if (!parsed) return;

        const key = buildEventKey(String(notice.id), parsed.startISO);
        if (eventKeys.has(key)) return;

        eventKeys.add(key);
        additions.push({
          id: generateEventId(),
          noticeId: String(notice.id),
          title: notice.title || "공지사항",
          startDate: parsed.startISO,
          endDate: parsed.endISO,
          createdAt: new Date().toISOString(),
          source: "auto",
        });
      });

      if (additions.length === 0) return;

      const nextEvents = [...existing, ...additions];
      setCalendarEvents(nextEvents);
      set({ events: nextEvents });
    },
  };
});
