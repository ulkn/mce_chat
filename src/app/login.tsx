import { Link } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { AuthField, AuthForm } from '@/components/AuthForm';
import { auth } from '@/lib/firebase';
import { authErrorMessage } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifreni yaz.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(authErrorMessage(e instanceof FirebaseError ? e.code : ''));
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setError('Önce e-posta adresini yaz, sıfırlama bağlantısını oraya gönderelim.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('E-posta gönderildi', 'Şifre sıfırlama bağlantısı için gelen kutunu kontrol et.');
    } catch (e) {
      setError(authErrorMessage(e instanceof FirebaseError ? e.code : ''));
    }
  };

  return (
    <AuthForm
      title="Yaren"
      subtitle="Hesabına giriş yap, sohbete kaldığın yerden devam et."
      error={error}
      submitLabel="Giriş yap"
      submitting={submitting}
      onSubmit={submit}
      footer={
        <>
          <Pressable onPress={resetPassword} hitSlop={8}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>Şifremi unuttum</Text>
          </Pressable>
          <Link href="/register" replace>
            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>Hesabın yok mu? Kayıt ol</Text>
          </Link>
        </>
      }>
      <AuthField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@eposta.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
      />
      <AuthField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="Şifren"
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        onSubmitEditing={submit}
        returnKeyType="go"
      />
    </AuthForm>
  );
}
