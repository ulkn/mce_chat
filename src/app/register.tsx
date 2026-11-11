import { Link } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { Text } from 'react-native';

import { AuthField, AuthForm } from '@/components/AuthForm';
import { authErrorMessage } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      setError('Adını yaz; arkadaşların seni bu isimle görecek.');
      return;
    }
    if (!email.trim() || !password) {
      setError('E-posta ve şifreni yaz.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(name, email, password);
    } catch (e) {
      setError(authErrorMessage(e instanceof FirebaseError ? e.code : ''));
      setSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Hesap oluştur"
      subtitle="Birkaç bilgiyle hemen başla."
      error={error}
      submitLabel="Kayıt ol"
      submitting={submitting}
      onSubmit={submit}
      footer={
        <Link href="/login" replace>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>Zaten hesabın var mı? Giriş yap</Text>
        </Link>
      }>
      <AuthField
        label="Ad Soyad"
        value={name}
        onChangeText={setName}
        placeholder="Adın"
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
      />
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
        placeholder="En az 6 karakter"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        onSubmitEditing={submit}
        returnKeyType="go"
      />
    </AuthForm>
  );
}
