export interface SessionFormData {
  activityId: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  maxCapacity: number;
  notes: string;
  description: string;
  link?: string;
}

export interface Session {
  id: string;
  activityId: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  currentBookings: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  notes: string;
  description: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}