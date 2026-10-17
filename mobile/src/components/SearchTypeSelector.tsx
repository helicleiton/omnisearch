import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import type { SearchTypeInput } from '../types/api';
import { SEARCH_TYPE_OPTIONS } from '../utils/searchTypes';

interface Props {
  value: SearchTypeInput;
  onChange: (value: SearchTypeInput) => void;
  disabled?: boolean;
}

export function SearchTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {SEARCH_TYPE_OPTIONS.map((option) => (
        <Chip
          key={option.value}
          icon={option.icon}
          selected={value === option.value}
          showSelectedOverlay
          disabled={disabled}
          onPress={() => onChange(option.value)}
          accessibilityLabel={`Buscar por ${option.label}`}
        >
          {option.label}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
});
