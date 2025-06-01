import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Alert,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, db, Timestamp } from '../../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName?: string;
  timestamp: Timestamp;
  score: number;
}

const EventDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [userHasCommented, setUserHasCommented] = useState(false);
  const [score, setScore] = useState<number>(5);

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, 'events', id!);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert('Evento no encontrado');
        router.back();
      }
    };

    const fetchComments = () => {
      const commentsRef = collection(db, 'events', id!, 'comments');
      const q = query(commentsRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newComments: Comment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName || 'Usuario desconocido',
            timestamp: data.timestamp,
            score: data.score || 0,
          };
        });

        setComments(newComments);

        const currentUser = auth.currentUser;
        if (currentUser) {
          const alreadyCommented = newComments.some(
            (c) => c.userId === currentUser.uid
          );
          setUserHasCommented(alreadyCommented);
        }
      });

      return unsubscribe;
    };

    fetchEvent();
    const unsubscribeComments = fetchComments();

    return () => unsubscribeComments();
  }, [id]);

  const handleAddComment = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Debes iniciar sesión para comentar');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Comentario vacío', 'Por favor escribe algo.');
      return;
    }

    if (userHasCommented) {
      Alert.alert('Ya has comentado este evento.');
      return;
    }

    try {
      const commentData = {
        text: commentText,
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        timestamp: Timestamp.now(),
        score,
      };

      await addDoc(collection(db, 'events', id!, 'comments'), commentData);
      setCommentText('');
      setScore(5);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario.');
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => setScore(value)}
            style={[
              styles.star,
              score >= value ? styles.starSelected : styles.starUnselected,
            ]}
          >
            <Text style={styles.starText}>⭐</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  if (!event) return <Text style={styles.loadingText}>Cargando evento...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.backText}>Regresar</Text>
      </Pressable>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description}>Descripción: {event.description}</Text>
      <Text style={styles.description}>Ubicación: {event.location}</Text>
      <Text style={styles.date}>
        Fecha: {new Date(event.date?.seconds * 1000).toLocaleString()}
      </Text>

      <Text style={styles.sectionTitle}>Comentarios</Text>

      {!userHasCommented && (
        <>
         

          <Button title="Agregar comentario" onPress={handleAddComment} />

           <TextInput
            placeholder="Escribe un comentario..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.input}
          />

          <Text style={styles.label}>Puntuación:</Text>
          {renderStars()}
        </>
      )}

      {userHasCommented && (
        <Text style={styles.infoText}>Ya has comentado en este evento.</Text>
      )}

      {comments.length === 0 ? (
        <Text style={styles.noComments}>No hay comentarios aún.</Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} style={styles.commentBox}>
            <Text style={styles.commentUser}>{comment.userName}</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentMeta}>
              {new Date(comment.timestamp?.seconds * 1000).toLocaleString()} -{' '}
              {comment.score} ⭐
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 16,
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  noComments: {
    color: '#666',
    fontStyle: 'italic',
  },
  commentBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentMeta: {
    fontSize: 12,
    color: '#777',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 4,
    padding: 6,
    borderRadius: 6,
  },
  starSelected: {
    backgroundColor: '#ffd700',
  },
  starUnselected: {
    backgroundColor: '#e0e0e0',
  },
  starText: {
    fontSize: 20,
  },
  infoText: {
    fontStyle: 'italic',
    color: 'green',
    marginBottom: 10,
  },
});

export default EventDetailsScreen;
