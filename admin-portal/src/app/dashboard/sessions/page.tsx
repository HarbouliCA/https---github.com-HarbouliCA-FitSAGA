'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, NavigateAction, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ListBulletIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.css';

type ActivityType = 'ENTREMIENTO_PERSONAL' | 'KICK_BOXING' | 'SALE_FITNESS' | 'CLASES_DERIGIDAS';

interface Session {
  id: string;
  activityType: ActivityType;
  activityName?: string;
  title?: string;
  description?: string;
  notes?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  enrolledCount: number;
  bookedCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructorId: string;
  instructorName: string;
  instructor: string;
  instructorPhotoURL?: string;
  recurring: RecurringRule | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringRule {
  frequency: string;
  repeatEvery: number;
  endDate: Date;
  weekdays?: string[];
  parentSessionId?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Session;
  instructor?: {
    id: string;
    name: string;
    photoURL?: string;
  };
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Generate a consistent color based on instructor ID
const getInstructorColor = (instructorId: string) => {
  const colors = [
    'rgb(254, 243, 199)', // yellow-100
    'rgb(220, 252, 231)', // green-100
    'rgb(224, 242, 254)', // blue-100
    'rgb(254, 226, 226)', // red-100
    'rgb(237, 233, 254)', // purple-100
    'rgb(255, 237, 213)', // orange-100
    'rgb(249, 250, 251)', // gray-100
  ];
  
  // Simple hash function to get a consistent index
  const hash = instructorId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

const SessionsPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);

  const CustomToolbar = (props: ToolbarProps<CalendarEvent>) => {
    const viewLabels = {
      month: 'Month',
      week: 'Week',
      day: 'Day'
    };

    const dateLabel = format(props.date, props.view === 'day' ? 'PPPP' : props.view === 'week' ? "'Week of' MMMM d, yyyy" : 'MMMM yyyy');

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-200 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => props.onNavigate('TODAY')}
            size="sm"
          >
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => props.onNavigate('PREV')}
              icon={ChevronLeftIcon}
              size="sm"
              aria-label="Previous"
            />
            <Button
              variant="secondary"
              onClick={() => props.onNavigate('NEXT')}
              icon={ChevronRightIcon}
              size="sm"
              aria-label="Next"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {dateLabel}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="">All Instructors</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {Object.entries(viewLabels).map(([viewKey, label]) => (
              <Button
                key={viewKey}
                variant={props.view === viewKey ? 'primary' : 'secondary'}
                onClick={() => props.onView(viewKey as View)}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchSessions = async () => {
      if (!firestore) return;
      
      try {
        const sessionsRef = collection(firestore, 'sessions');
        const querySnapshot = await getDocs(sessionsRef);
        
        const fetchedSessions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            activityType: data.activityType as ActivityType,
            activityName: data.activityName || 'Unnamed Activity',
            title: data.title || data.activityName || 'Unnamed Activity',
            description: data.description || '',
            notes: data.notes || '',
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            capacity: Number(data.capacity) || 10,
            enrolledCount: Number(data.enrolledCount) || 0,
            bookedCount: Number(data.enrolledCount) || 0,
            status: data.status || 'scheduled',
            instructorId: data.instructorId || '',
            instructorName: data.instructorName || '',
            instructor: data.instructorName || '',
            instructorPhotoURL: data.instructorPhotoURL || null,
            recurring: data.recurring ? {
              frequency: data.recurring.frequency || 'weekly',
              repeatEvery: Number(data.recurring.repeatEvery) || 1,
              endDate: data.recurring.endDate?.toDate() || new Date(),
              weekdays: data.recurring.weekdays || [],
              parentSessionId: data.recurring.parentSessionId
            } : null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Session;
        });
        
        // Extract unique instructors with proper key handling
        const instructorMap = new Map();
        fetchedSessions
          .filter(s => s.instructorId && s.instructorName)
          .forEach(s => {
            if (!instructorMap.has(s.instructorId)) {
              instructorMap.set(s.instructorId, {
                id: s.instructorId,
                name: s.instructorName
              });
            }
          });
        
        setInstructors(Array.from(instructorMap.values()));
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [firestore]);

  const filteredSessions = selectedInstructor
    ? sessions.filter(session => session.instructorId === selectedInstructor)
    : sessions;

  const events = filteredSessions.map(session => ({
    id: session.id,
    title: session.activityName || 'Untitled Session',
    start: session.startTime,
    end: session.endTime,
    resource: session,
    instructor: session.instructorId ? {
      id: session.instructorId,
      name: session.instructorName,
      photoURL: session.instructorPhotoURL
    } : undefined
  }));

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.instructor
      ? getInstructorColor(event.instructor.id)
      : 'rgb(249, 250, 251)'; // gray-100

    return {
      style: {
        backgroundColor,
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '4px'
      }
    };
  };

  const EventComponent = ({ event, title }: { event: CalendarEvent, title: string }) => {
    // Determine if we're in a compact view (week/day) based on event title display
    const isCompactView = !title;
    
    return (
      <div className={`${isCompactView ? 'p-0.5 text-xs' : 'p-1'} overflow-hidden h-full`}>
        <div className={`font-medium text-gray-900 ${isCompactView ? 'truncate' : ''}`}>
          {event.title}
        </div>
        {event.instructor && !isCompactView && (
          <div className="flex items-center mt-1 text-sm text-gray-600">
            {event.instructor.photoURL ? (
              <Image
                src={event.instructor.photoURL}
                alt={event.instructor.name}
                width={16}
                height={16}
                className="rounded-full mr-1"
              />
            ) : (
              <UserCircleIcon className="h-4 w-4 mr-1" />
            )}
            <span>{event.instructor.name}</span>
          </div>
        )}
        {event.instructor && isCompactView && (
          <div className="truncate text-xs text-gray-600">
            {event.instructor.name}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageNavigation
          title="Sessions"
          actions={[
            {
              label: 'List View',
              icon: ListBulletIcon,
              href: '/dashboard/sessions/list',
              variant: 'secondary'
            },
            {
              label: 'New Session',
              icon: PlusIcon,
              href: '/dashboard/sessions/create',
              variant: 'primary'
            }
          ]}
        />
        <div className="mt-6 bg-white rounded-lg shadow p-6 flex items-center justify-center h-[700px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageNavigation
        title="Sessions"
        actions={[
          {
            label: 'List View',
            icon: ListBulletIcon,
            href: '/dashboard/sessions/list',
            variant: 'secondary'
          },
          {
            label: 'New Session',
            icon: PlusIcon,
            href: '/dashboard/sessions/create',
            variant: 'primary'
          }
        ]}
      />

      <div className="mt-6 bg-white rounded-lg shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          defaultView="month"
          view={view}
          onView={setView as (view: View) => void}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => router.push(`/dashboard/sessions/${event.id}`)}
          formats={{
            timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
            eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
              return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
            },
            agendaTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
              return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
            }
          }}
        />
      </div>
    </div>
  );
};

export default SessionsPage;
