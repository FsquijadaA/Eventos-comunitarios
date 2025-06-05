// app/(app)/events/my-events.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { LineChart } from 'react-native-chart-kit';

export default function MyEventsScreen() {
  const [events, setEvents] = useState<{ id: string; [key: string]: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'events'), where('createdBy', '==', user.uid));
        const snapshot = await getDocs(q);
        const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log('Todos los eventos creados por el usuario:', allData);

        setEvents(allData);
      } catch (error) {
        console.error('Error fetching user events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  const renderItem = ({ item }: any) => (
      <View style={styles.eventCard}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.label}>Fecha:</Text>
        <Text>{new Date(item.date?.seconds * 1000).toLocaleDateString('es-ES')}</Text>
        <Text style={styles.label}>Ubicación:</Text>
        <Text>{item.location}</Text>
        <Text style={styles.label}>Participantes registrados:</Text>
        <Text>{item.participants?.length || 0}</Text>
        <Text style={styles.label}>Asistencias confirmadas:</Text>
        <Text>{item.attendees?.length || 0}</Text>
      </View>
  );

  const chartData = {
    labels: events.map((e: any, i: number) => `Ev${i + 1}`),
    datasets: [
      {
        data: events.map((e: any) => e.attendees?.length || 0),
        strokeWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
  }

  return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.chartTitle}>Tendencia de Asistencias</Text>
        <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            bezier
            style={{ borderRadius: 16, marginBottom: 20 }}
        />

        <FlatList
            data={events}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={<Text>No tienes eventos creados.</Text>}
        />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftColor: '#007AFF',
    borderLeftWidth: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginTop: 6,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
