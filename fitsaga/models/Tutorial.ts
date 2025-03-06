export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'workout' | 'nutrition';
  videoUrl?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}
