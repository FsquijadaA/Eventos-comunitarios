import { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Timestamp; // ✅ Asegura que TypeScript sepa que es un Timestamp
  location: string;
  attendees: string[];
  createdBy: string;
  createdAt: string;
}
