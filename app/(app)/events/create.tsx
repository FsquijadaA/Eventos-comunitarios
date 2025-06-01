// app/(app)/events/create.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { Calendar, DateData } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';

interface ErrorState {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  general?: string;
}

async function scheduleReminderNotification(eventTitle: string, eventDate: Date) {
  const threeDaysBefore = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (threeDaysBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de Evento',
        body: `Tu evento "${eventTitle}" es en 3 días`,
      },
      trigger: threeDaysBefore,
    });
  }
}

function showImmediateUpcomingAlert(eventTitle: string, eventDate: Date) {
  const now = new Date();
  const inThreeDays = new Date();
  inThreeDays.setDate(now.getDate() + 3);
  if (eventDate >= now && eventDate <= inThreeDays) {
    Alert.alert(
        'Evento próximo',
        `El evento "${eventTitle}" ocurrirá en los próximos 3 días.`
    );
  }
}

export default function CreateEventScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const validateForm = (): boolean => {
    const newErrors: ErrorState = {};
    if (!title.trim()) newErrors.title = 'El título es requerido';
    if (!description.trim()) newErrors.description = 'La descripción es requerida';
    if (!location.trim()) newErrors.location = 'La ubicación es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const eventData = {
        title,
        description,
        date: Timestamp.fromDate(date),
        location,
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        attendees: [auth.currentUser?.uid],
      };
      await addDoc(collection(db, 'events'), eventData);
      await scheduleReminderNotification(title, date);
      showImmediateUpcomingAlert(title, date);
      router.replace('/(app)/events');
    } catch (error) {
      console.error('Error al crear evento:', error);
      setErrors({ general: 'Error al crear el evento. Por favor intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {errors.general && <Text style={styles.errorGeneral}>{errors.general}</Text>}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título</Text>
            <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  setErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="Título del evento"
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrors(prev => ({ ...prev, description: undefined }));
                }}
                placeholder="Descripción del evento"
                multiline
                numberOfLines={4}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fecha del evento</Text>
            <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ubicación</Text>
            <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  setErrors(prev => ({ ...prev, location: undefined }));
                }}
                placeholder="Ubicación del evento"
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          <TouchableOpacity
              style={styles.button}
              onPress={handleCreateEvent}
              disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.buttonText}>Crear Evento</Text>
            )}
          </TouchableOpacity>

          <Modal visible={showCalendar} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.calendarContainer}>
                <Calendar
                    onDayPress={(day: DateData) => {
                      setDate(new Date(day.timestamp));
                      setShowCalendar(false);
                      setErrors(prev => ({ ...prev, date: undefined }));
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    markedDates={{
                      [date.toISOString().split('T')[0]]: {
                        selected: true,
                        selectedColor: '#007AFF'
                      }
                    }}
                />
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  errorGeneral: {
    color: '#ff3b30', textAlign: 'center', marginBottom: 15,
    backgroundColor: '#fff5f5', padding: 10, borderRadius: 8
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, backgroundColor: '#fafafa'
  },
  inputError: { borderColor: '#ff3b30' },
  textArea: { height: 100, textAlignVertical: 'top' },
  dateInput: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  dateText: { color: '#333', fontSize: 16 },
  errorText: { color: '#ff3b30', fontSize: 12, marginTop: 5, marginLeft: 5 },
  button: {
    backgroundColor: '#007AFF', padding: 15, borderRadius: 8,
    alignItems: 'center', marginTop: 20
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  calendarContainer: {
    backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%'
  },
  closeButton: {
    backgroundColor: '#007AFF', padding: 10, borderRadius: 8,
    marginTop: 10, alignItems: 'center'
  },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
