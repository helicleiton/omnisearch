import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { RiskStatus } from '../types/api';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1F4E8C',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D7E3F8',
    secondaryContainer: '#D7E3F8',
    background: '#F5F7FA',
  },
};

export const STATUS_META: Record<RiskStatus, { label: string; icon: string; color: string; background: string }> = {
  safe: { label: 'Seguro', icon: 'shield-check', color: '#1E7A46', background: '#E3F4EA' },
  attention: { label: 'Atenção', icon: 'alert', color: '#9A6200', background: '#FFF2D6' },
  alert: { label: 'Alerta', icon: 'alert-octagon', color: '#B3261E', background: '#FCE4E2' },
  unverified: { label: 'Somente validação', icon: 'information-outline', color: '#3F5873', background: '#E3EAF2' },
};
