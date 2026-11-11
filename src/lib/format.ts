const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysAgo(ms: number, now: number): number {
  return Math.round((startOfDay(now) - startOfDay(ms)) / 86400000);
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Sohbet listesindeki kısa zaman: bugün saat, dün "Dün", bu hafta gün adı, yoksa tarih.
export function formatListTime(ms: number, now = Date.now()): string {
  const diff = daysAgo(ms, now);
  if (diff <= 0) return formatClock(ms);
  if (diff === 1) return 'Dün';
  if (diff < 7) return DAYS[new Date(ms).getDay()];
  const d = new Date(ms);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Sohbet içindeki gün ayracı.
export function formatDayLabel(ms: number, now = Date.now()): string {
  const diff = daysAgo(ms, now);
  if (diff <= 0) return 'Bugün';
  if (diff === 1) return 'Dün';
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ` ${d.getFullYear()}`}`;
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(online: boolean, lastSeen: number | null, now = Date.now()): boolean {
  return online && lastSeen !== null && now - lastSeen < ONLINE_WINDOW_MS;
}

export function formatLastSeen(online: boolean, lastSeen: number | null, now = Date.now()): string {
  if (isOnline(online, lastSeen, now)) return 'çevrimiçi';
  if (lastSeen === null) return 'uzun süredir görülmedi';
  const diff = daysAgo(lastSeen, now);
  if (diff <= 0) return `son görülme bugün ${formatClock(lastSeen)}`;
  if (diff === 1) return `son görülme dün ${formatClock(lastSeen)}`;
  return `son görülme ${formatDayLabel(lastSeen, now)}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toLocaleUpperCase('tr-TR');
}

export function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-posta adresi geçerli değil.';
    case 'auth/missing-password':
      return 'Şifreni yaz.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta ile zaten bir hesap var.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta ya da şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı kurulamadı.';
    default:
      return 'Bir şeyler ters gitti. Tekrar dene.';
  }
}
