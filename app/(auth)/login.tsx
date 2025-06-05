import { FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

interface ErrorState {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorState>({});
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/events' as const);
    } catch (error: any) {
      setErrors({ general: 'Credenciales inválidas' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ErrorState = {};
    if (!email) newErrors.email = 'El correo es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleFacebookLogin = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Usuario:', result.user);
      router.replace('/events');
    } catch (error) {
      console.error('Error con Facebook:', error);
      setErrors({ general: 'Error al iniciar sesión con Facebook' });
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos Comunitarios</Text>
      {errors.general && (
        <Text style={styles.errorGeneral}>{errors.general}</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors(prev => ({ ...prev, email: undefined }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Contraseña"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors(prev => ({ ...prev, password: undefined }));
          }}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleEmailLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.facebookButton}
        onPress={handleFacebookLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Iniciar sesión con Facebook</Text>
      </TouchableOpacity>


      <TouchableOpacity
        onPress={() => router.push('/register' as const)}
        style={styles.linkContainer}
      >
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorGeneral: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 15,
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
  facebookButton: {
    backgroundColor: '#4267B2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
