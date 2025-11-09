// src/types/calendar.ts

export interface CalendarEvent {
  id: string;
  noticeId: string;
  title: string;
  startDate: string; // ISO string  
  endDate: string | null; // ISO string or null
  createdAt: string; // ISO string
}

export interface CalendarEventInput {
  noticeId: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
}

