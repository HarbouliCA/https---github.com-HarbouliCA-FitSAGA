export interface Session {
  id: string;
  activityId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  currentParticipants: number;
  scoreValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionBooking {
  id: string;
  userId: string;
  sessionId: string;
  status: 'booked' | 'attended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
