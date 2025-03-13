'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, NavigateAction, ToolbarProps, SlotInfo } from 'react-big-calendar';
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
  }
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
    '#4F46E5', // Indigo
    '#0891B2', // Cyan
    '#059669', // Emerald
    '#D97706', // Amber
    '#DC2626', // Red
    '#7C3AED', // Violet
    '#DB2777', // Pink
    '#2563EB', // Blue
  ];
  
  // Simple hash function for the instructor ID
  let hash = 0;
  for (let i = 0; i < instructorId.length; i++) {
    hash = instructorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const SessionsCalendarPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key for forcing re-renders

  // Force a refresh when the component mounts or when navigating back to this page
  useEffect(() => {
    // This will run when the component mounts
    setRefreshKey(prev => prev + 1);
    
    // Add event listener for when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!firestore) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const sessionsCollection = collection(firestore, 'sessions');
        const snapshot = await getDocs(sessionsCollection);
        
        const fetchedSessions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            activityType: data.activityType,
            activityName: data.activityName || '',
            title: data.title || '',
            description: data.description || '',
            notes: data.notes || '',
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            capacity: Number(data.capacity) || 0,
            enrolledCount: Number(data.enrolledCount) || 0,
            bookedCount: Number(data.bookedCount) || 0,
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
  }, [firestore, refreshKey]);

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

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/dashboard/sessions/${event.id}`);
  };

  const eventPropGetter = (event: CalendarEvent) => {
    const instructorId = event.instructor?.id;
    
    // Default color for sessions without instructor
    if (!instructorId) {
      return {
        style: {
          backgroundColor: '#9CA3AF', // Gray color for sessions without instructor
          borderColor: '#9CA3AF',
        }
      };
    }
    
    const backgroundColor = getInstructorColor(instructorId);
    
    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
      }
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageNavigation
          title="Sessions Calendar"
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
        title="Sessions Calendar"
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200">
          <div className="w-full sm:w-auto mb-4 sm:mb-0">
            <label htmlFor="instructor-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Instructor
            </label>
            <select
              id="instructor-filter"
              value={selectedInstructor}
              onChange={(e) => setSelectedInstructor(e.target.value)}
              className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
            >
              <option value="">All Instructors</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {instructors.map(instructor => (
              <div 
                key={instructor.id}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: `${getInstructorColor(instructor.id)}20` }}
              >
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getInstructorColor(instructor.id) }}
                ></span>
                <span className="font-medium">{instructor.name}</span>
              </div>
            ))}
          </div>
        </div>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          views={['month', 'week', 'day']}
          view={view}
          date={date}
          onView={setView}
          onNavigate={(newDate) => {
            setDate(newDate);
          }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          components={{
            toolbar: CustomToolbar,
            event: (props) => {
              const event = props.event as CalendarEvent;
              const session = event.resource;
              
              return (
                <div className="flex items-center gap-1 h-full overflow-hidden">
                  {session.instructorPhotoURL ? (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full overflow-hidden">
                      <Image 
                        src={session.instructorPhotoURL} 
                        alt={session.instructorName}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <UserCircleIcon className="w-4 h-4 text-white" />
                  )}
                  <div className="truncate text-white text-sm">
                    {event.title}
                  </div>
                </div>
              );
            }
          }}
        />
      </div>
    </div>
  );
};

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
      <div className="flex items-center gap-2">
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => props.onView(v as View)}
              className={`px-3 py-1 text-sm ${
                props.view === v
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {viewLabels[v as keyof typeof viewLabels]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionsCalendarPage;
