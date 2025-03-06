'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, NavigateAction, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { useFirebase } from '@/contexts/FirebaseContext';
import { collection, getDocs } from 'firebase/firestore';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.css';

type ActivityType = 'ENTREMIENTO_PERSONAL' | 'KICK_BOXING' | 'SALE_FITNESS' | 'CLASES_DERIGIDAS';

interface Session {
  id: string;
  activityType: ActivityType;
  activityName?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  enrolledCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Session;
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

const SessionsPage = () => {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

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
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate() || new Date(),
            capacity: Number(data.capacity) || 10,
            enrolledCount: Number(data.enrolledCount) || 0,
            status: data.status || 'scheduled'
          } satisfies Session;
        });
        
        setSessions(fetchedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [firestore]);

  const events = sessions.map(session => ({
    id: session.id,
    title: session.activityName || 'Untitled Session',
    start: session.startTime,
    end: session.endTime,
    resource: session
  }));

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
          className="admin-calendar"
          views={['month', 'week', 'day']}
          defaultView={view}
          view={view}
          onView={setView}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          components={{
            toolbar: CustomToolbar
          }}
          messages={{
            noEventsInRange: 'No sessions scheduled for this period',
            showMore: (total) => `+${total} more`
          }}
          popup
          selectable={false}
          onSelectEvent={(event) => {
            router.push(`/dashboard/sessions/${event.resource.id}`);
          }}
          eventPropGetter={(event) => {
            const session = event.resource;
            const activityClass = {
              'ENTREMIENTO_PERSONAL': 'activity-personal',
              'KICK_BOXING': 'activity-kickboxing',
              'SALE_FITNESS': 'activity-fitness',
              'CLASES_DERIGIDAS': 'activity-classes'
            }[session.activityType] || '';

            const statusClass = `status-${session.status}`;

            return {
              className: `${activityClass} ${statusClass}`.trim()
            };
          }}
          tooltipAccessor={(event) => {
            const session = event.resource;
            const activityType = {
              'ENTREMIENTO_PERSONAL': 'Personal Training',
              'KICK_BOXING': 'Kick Boxing',
              'SALE_FITNESS': 'Fitness Sale',
              'CLASES_DERIGIDAS': 'Directed Classes'
            }[session.activityType] || session.activityType;

            const status = session.status.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return `${session.activityName}\n${activityType}\n${format(session.startTime, 'h:mm a')} - ${format(session.endTime, 'h:mm a')}\n${session.enrolledCount}/${session.capacity} enrolled\nStatus: ${status}`;
          }}
        />
      </div>
    </div>
  );
};

export default SessionsPage;
