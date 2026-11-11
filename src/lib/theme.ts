import { useColorScheme } from 'react-native';

const light = {
  dark: false,
  primary: '#D9532B',
  primaryText: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F6F2ED',
  chatBackground: '#F3ECE4',
  bubbleOut: '#FFDCC9',
  bubbleIn: '#FFFFFF',
  bubbleOutText: '#2A1B12',
  bubbleInText: '#1F1A16',
  text: '#1F1A16',
  textSecondary: '#7B7068',
  border: '#E7DFD6',
  inputBackground: '#FFFFFF',
  danger: '#C62828',
  online: '#2E9E5B',
  tick: '#8E8279',
  tickRead: '#D9532B',
  overlay: 'rgba(0,0,0,0.45)',
};

const dark: typeof light = {
  dark: true,
  primary: '#F0764E',
  primaryText: '#1A120D',
  background: '#17130F',
  surface: '#211B16',
  chatBackground: '#120F0C',
  bubbleOut: '#6B3320',
  bubbleIn: '#27201A',
  bubbleOutText: '#FFF1E8',
  bubbleInText: '#F2EAE2',
  text: '#F2EAE2',
  textSecondary: '#A3978C',
  border: '#332A22',
  inputBackground: '#27201A',
  danger: '#EF6B5E',
  online: '#4CC47F',
  tick: '#B79F90',
  tickRead: '#FFB392',
  overlay: 'rgba(0,0,0,0.6)',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

// İsimden sabit bir avatar rengi üretir.
const AVATAR_COLORS = ['#D9532B', '#2F7D8C', '#7A5AC7', '#B8872B', '#3E8E5A', '#C2477A', '#4B6CC4', '#8A6A52'];

export function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
