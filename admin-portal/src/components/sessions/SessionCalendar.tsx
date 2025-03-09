'use client';

import { Calendar, dateFnsLocalizer, Views, Components } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { Session } from '@/types';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

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

type CalendarEvent = Session & {
  title: string;
  start: Date;
  end: Date;
};

const getEventStyle = (event: CalendarEvent) => {
  const bookings = event.bookedCount !== undefined ? event.bookedCount : event.enrolledCount;
  const percentFull = (bookings / event.capacity) * 100;
  
  if (percentFull >= 100) {
    return { 
      style: {
        backgroundColor: '#FEE2E2',
        borderLeft: '4px solid #EF4444',
        color: '#991B1B'
      }
    };
  }
  if (percentFull >= 80) {
    return { 
      style: {
        backgroundColor: '#FEF3C7',
        borderLeft: '4px solid #F59E0B',
        color: '#92400E'
      }
    };
  }
  return { 
    style: {
      backgroundColor: '#D1FAE5',
      borderLeft: '4px solid #10B981',
      color: '#065F46'
    }
  };
};

const TimeGutterHeader = () => (
  <div className="rbc-time-header-gutter" style={{ minWidth: '0' }} />
);

interface EventComponentProps {
  event: CalendarEvent;
  title?: string;
}

const EventComponent = ({ event, title }: EventComponentProps) => {
  const isCompactView = !title;
  const bookings = event.bookedCount !== undefined ? event.bookedCount : event.enrolledCount;
  const percentFull = Math.round((bookings / event.capacity) * 100);
  
  return (
    <div className={`h-full flex flex-col ${isCompactView ? 'p-1 text-xs' : 'p-2'}`}>
      <div className="font-medium truncate">
        {event.title || event.activityName}
      </div>
      {!isCompactView && (
        <>
          <div className="text-xs opacity-75 mt-1">
            {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              {event.instructorPhotoURL ? (
                <Image
                  src={event.instructorPhotoURL}
                  alt={event.instructorName}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-4 w-4" />
              )}
              <span className="text-xs ml-1">{event.instructorName}</span>
            </div>
            <div className="text-xs">
              {bookings}/{event.capacity} ({percentFull}%)
            </div>
          </div>
        </>
      )}
      {isCompactView && (
        <div className="flex items-center justify-between text-xs mt-0.5">
          <div className="truncate">{event.instructorName}</div>
          <div>{bookings}/{event.capacity}</div>
        </div>
      )}
    </div>
  );
};

export default function SessionCalendar({ sessions, onSelectEvent }: SessionCalendarProps) {
  const events: CalendarEvent[] = sessions.map(session => ({
    ...session,
    title: session.title || session.activityName,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
  }));

  const components: Components<CalendarEvent, object> = {
    timeGutterHeader: TimeGutterHeader,
    event: EventComponent
  };

  return (
    <div className="h-[600px] mt-4">
      <Calendar<CalendarEvent, object>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={['month', 'week', 'day']}
        defaultView={Views.MONTH}
        eventPropGetter={getEventStyle}
        onSelectEvent={onSelectEvent}
        components={components}
        formats={{
          timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
          eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
            return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
          }
        }}
      />
    </div>
  );
}