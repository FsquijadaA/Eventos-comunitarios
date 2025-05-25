// utils/seedDatabase.ts
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../config/firebase';

const sampleEvents = [
  {
    title: "Taller de Programación",
    description: "Aprende los fundamentos de la programación en este taller práctico.",
    date: new Date("2024-12-20").toISOString(),
    location: "Centro Comunitario Principal",
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    attendees: ["admin"]
  },
  {
    title: "Limpieza del Parque",
    description: "Únete a la comunidad para limpiar y mantener nuestro parque local.",
    date: new Date("2024-12-15").toISOString(),
    location: "Parque Central",
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    attendees: ["admin"]
  },
  {
    title: "Festival de Arte",
    description: "Exhibición de arte local con música en vivo y comida.",
    date: new Date("2024-12-25").toISOString(),
    location: "Plaza Principal",
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    attendees: ["admin"]
  }
];

export const initializeDatabase = async () => {
  try {
    // Verificar si ya hay eventos
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(query(eventsRef));
    
    if (eventsSnapshot.empty) {
      // Solo agregar eventos si no hay ninguno
      const promises = sampleEvents.map(event => addDoc(collection(db, 'events'), event));
      await Promise.all(promises);
      console.log('Base de datos inicializada con eventos de ejemplo');
      return true;
    } else {
      console.log('La base de datos ya contiene eventos');
      return false;
    }
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    return false;
  }
};