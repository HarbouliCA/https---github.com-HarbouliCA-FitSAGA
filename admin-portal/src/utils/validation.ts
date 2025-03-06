import { SessionFormData } from '../types/session'; 

export const validateSessionData = (data: SessionFormData): string | null => {
  if (!data.activityId) return 'Une activité doit être sélectionnée';
  if (!data.date) return 'La date est requise';
  if (!data.startTime) return "L'heure de début est requise";
  if (!data.endTime) return "L'heure de fin est requise";
  if (data.maxCapacity < 1) return 'La capacité doit être supérieure à 0';
  
  const start = new Date(`${data.date}T${data.startTime}`);
  const end = new Date(`${data.date}T${data.endTime}`);
  
  if (end <= start) {
    return "L'heure de fin doit être après l'heure de début";
  }
  
  return null;
};