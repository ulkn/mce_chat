import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

type Props = {
  title: string;
  subtitle: string;
  error: string | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
};

// Giriş ve kayıt ekranlarının ortak iskeleti.
export function AuthForm({ title, subtitle, error, submitLabel, submitting, onSubmit, footer, children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Ionicons name="chatbubbles" size={38} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

        <View style={styles.fields}>{children}</View>

        {error ? (
          <Text style={[styles.error, { color: theme.danger }]} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primary, opacity: pressed || submitting ? 0.75 : 1 },
          ]}>
          {submitting ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>{submitLabel}</Text>
          )}
        </Pressable>

        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthField(props: TextInputProps & { label: string }) {
  const theme = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        style={[
          styles.input,
          { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  logo: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 16, marginTop: 6, lineHeight: 22 },
  fields: { marginTop: 28, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { height: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16 },
  error: { marginTop: 14, fontSize: 14 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  buttonText: { fontSize: 17, fontWeight: '600' },
  footer: { marginTop: 22, alignItems: 'center', gap: 14 },
});
