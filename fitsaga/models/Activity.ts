export interface Activity {
  id: string;
  name: string;
  description: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
