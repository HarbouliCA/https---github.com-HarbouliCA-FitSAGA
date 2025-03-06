export type ActivityType = 'ENTREMIENTO_PERSONAL' | 'KICK_BOXING' | 'SALE_FITNESS' | 'CLASES_DERIGIDAS';

export type ActivityDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ActivityFormData {
  name: string;
  description: string;
  type: ActivityType;
  duration: number;
  capacity: number;
  difficulty: ActivityDifficulty;
  creditValue: number;
}

export interface Activity extends ActivityFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
