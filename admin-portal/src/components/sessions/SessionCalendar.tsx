'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Session } from '@/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface SessionCalendarProps {
  sessions: Session[];
  onSelectEvent: (session: Session) => void;
}

const getEventStyle = (session: Session) => {
  if (session.bookedCount  >= session.capacity) {
    return { backgroundColor: '#EF4444' }; // Full
  }
  if (session.bookedCount  >= session.capacity * 0.8) {
    return { backgroundColor: '#F59E0B' }; // Almost full
  }
  return { backgroundColor: '#10B981' }; // Available
};

export default function SessionCalendar({ sessions, onSelectEvent }: SessionCalendarProps) {
  const events = sessions.map(session => ({
    ...session,
    title: session.activityName,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
  }));

  return (
    <div className="h-[600px] mt-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day']}
        defaultView={Views.MONTH}
        eventPropGetter={(event) => ({
          style: getEventStyle(event as Session),
        })}
        onSelectEvent={(event) => onSelectEvent(event as Session)}
        tooltipAccessor={(event) => `${event.title} - ${format(event.start, 'h:mm a')}`}
      />
    </div>
  );
}