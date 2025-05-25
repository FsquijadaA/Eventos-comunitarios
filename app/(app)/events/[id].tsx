// app/(app)/events/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../../../types/event';
import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

export default function EventDetailScreen() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';

  // ✅ Cargar el evento cada vez que la pantalla reciba foco
  useFocusEffect(
    useCallback(() => {
      const fetchEvent = async () => {
        try {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          if (eventDoc.exists()) {
            setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
          }
        } catch (error) {
          console.error('Error fetching event:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }, [eventId])
  );

  const handleAttend = async () => {
    if (!event || !auth.currentUser?.uid) return;

    try {
      const alreadyAttending = event.attendees?.includes(auth.currentUser.uid);
      if (alreadyAttending) {
        Alert.alert("Ya estás inscrito en este evento.");
        return;
      }

      const updatedAttendees = [...(event.attendees || []), auth.currentUser.uid];
      await updateDoc(doc(db, 'events', eventId), {
        attendees: updatedAttendees,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      setEvent({ ...event, attendees: updatedAttendees });
      showMessage({
        message: "¡Te has inscrito correctamente!",
        type: "success",
        icon: "success",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error al registrarse como asistente:', error);
      Alert.alert('Error', 'No se pudo registrar tu asistencia.');
    }
  };

  const handleDelete = () => {
    console.log("📣 Dentro de handleDelete");

    if (Platform.OS === 'web') {
      const confirm = window.confirm("¿Estás seguro de que deseas eliminar este evento?");
      if (confirm) confirmDelete();
    } else {
      Alert.alert(
        "Eliminar Evento",
        "¿Estás seguro de que deseas eliminar este evento?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => confirmDelete() }
        ]
      );
    }
  };

  const confirmDelete = async () => {
    try {
      console.log("🧨 Intentando eliminar...");
      await deleteDoc(doc(db, 'events', eventId));
      Alert.alert('Eliminado', 'El evento fue eliminado correctamente');
      router.replace('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'No se pudo eliminar el evento');
    }
  };




  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text>Evento no encontrado</Text>
      </View>
    );
  }

  const isEventCreator = event.createdBy === auth.currentUser?.uid;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        {isEventCreator && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                router.push({
                  pathname: `events/edit/[id]`,
                  params: { id: eventId }
                } as any);
              }}
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {(() => {
                try {
                  if (event.date && typeof event.date.toDate === 'function') {
                    return event.date.toDate().toLocaleDateString();
                  } else {
                    return new Date(String(event.date)).toLocaleDateString();
                  }
                } catch (error) {
                  console.error("Fecha inválida:", error);
                  return "Fecha no válida";
                }
              })()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{event.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              {event.attendees?.length || 0} asistentes
            </Text>
          </View>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Descripción</Text>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {!isEventCreator && !event.attendees?.includes(auth.currentUser?.uid || '') && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleAttend}
            >
              <Text style={styles.asistir}>Asistir</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  descriptionContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  asistir: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
