import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type SheetOption = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

// iOS'ta yerel eylem sayfası, Android'de basit bir seçim penceresi açar.
export function showActionSheet(options: SheetOption[], title?: string): void {
  if (options.length === 0) return;
  if (Platform.OS === 'ios') {
    const labels = [...options.map((o) => o.label), 'Vazgeç'];
    const destructive = options.map((o, i) => (o.destructive ? i : -1)).filter((i) => i >= 0);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: destructive,
      },
      (index) => {
        if (index < options.length) options[index].onPress();
      }
    );
    return;
  }
  Alert.alert(title ?? 'Seç', undefined, [
    ...options.map((o) => ({
      text: o.label,
      style: o.destructive ? ('destructive' as const) : ('default' as const),
      onPress: o.onPress,
    })),
    { text: 'Vazgeç', style: 'cancel' as const },
  ]);
}

export function confirm(title: string, message: string, actionLabel: string, onConfirm: () => void): void {
  Alert.alert(title, message, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function showError(error: unknown, fallback = 'Bir şeyler ters gitti. Tekrar dene.'): void {
  const message = error instanceof Error && error.message ? error.message : fallback;
  Alert.alert('Olmadı', message);
}
