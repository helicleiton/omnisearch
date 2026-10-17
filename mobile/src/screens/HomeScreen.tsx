import { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResultCard } from '../components/ResultCard';
import { SearchTypeSelector } from '../components/SearchTypeSelector';
import { OPEN_DATA_MODE } from '../config/env';
import { useSearch } from '../hooks/useSearch';
import type { SearchTypeInput } from '../types/api';
import { guessType, SEARCH_TYPE_OPTIONS, TYPE_LABELS } from '../utils/searchTypes';

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchTypeInput>('auto');
  const { state, search, reset, isLoading } = useSearch();

  const option = SEARCH_TYPE_OPTIONS.find((o) => o.value === type) ?? SEARCH_TYPE_OPTIONS[0]!;
  const guessed = useMemo(() => (type === 'auto' ? guessType(query) : null), [query, type]);
  const canSubmit = query.trim().length >= 3 && !isLoading;
  const error = state.status === 'error' ? state.error : null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    void search(query, type);
  };

  const handleNewSearch = () => {
    reset();
    setQuery('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              OmniSearch
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Verifique a exposição de dados em fontes públicas e vazamentos.
            </Text>
            {OPEN_DATA_MODE && (
              <Text variant="bodySmall" style={styles.subtitle}>
                Consultas feitas direto do seu aparelho em fontes abertas e gratuitas (XposedOrNot, BrasilAPI, DNS do Google).
                Nada é armazenado.
              </Text>
            )}
          </View>

          {state.status === 'success' ? (
            <ResultCard result={state.result} onNewSearch={handleNewSearch} />
          ) : (
            <Surface style={styles.form} elevation={1}>
              <Text variant="labelLarge">Tipo de busca</Text>
              <SearchTypeSelector value={type} onChange={setType} disabled={isLoading} />

              <View>
                <TextInput
                  mode="outlined"
                  label="Dado para consulta"
                  placeholder={option.placeholder}
                  value={query}
                  onChangeText={setQuery}
                  keyboardType={option.keyboardType}
                  autoCapitalize={type === 'name' ? 'words' : 'none'}
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                  editable={!isLoading}
                  maxLength={150}
                  error={Boolean(error?.fields?.query || error?.code === 'INVALID_INPUT')}
                  left={<TextInput.Icon icon={option.icon} />}
                  right={
                    query.length > 0 && !isLoading ? (
                      <TextInput.Icon icon="close-circle" onPress={() => setQuery('')} accessibilityLabel="Limpar campo" />
                    ) : undefined
                  }
                />
                <HelperText type="info" visible={Boolean(guessed)}>
                  {guessed === 'name' && OPEN_DATA_MODE
                    ? 'Busca por nome indisponível nesta versão'
                    : guessed
                      ? `Parece ser: ${TYPE_LABELS[guessed]}`
                      : ' '}
                </HelperText>
              </View>

              {error && (
                <Surface style={styles.errorBox} elevation={0}>
                  <Text variant="titleSmall" style={styles.errorTitle}>
                    {ERROR_TITLES[error.code] ?? 'Erro'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.errorText}>
                    {error.message}
                  </Text>
                </Surface>
              )}

              <Button
                mode="contained"
                icon="magnify"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!canSubmit}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? 'Consultando...' : 'Realizar Consulta'}
              </Button>
            </Surface>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ERROR_TITLES: Partial<Record<string, string>> = {
  NETWORK_ERROR: 'Sem conexão',
  TIMEOUT: 'Tempo esgotado',
  INVALID_INPUT: 'Entrada inválida',
  NOT_FOUND: 'Nenhum resultado',
  RATE_LIMITED: 'Muitas consultas',
  UNAUTHORIZED: 'Acesso negado',
  UPSTREAM_ERROR: 'Serviço indisponível',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  flex: { flex: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  header: { gap: 4, marginTop: 8 },
  title: { fontWeight: '800', color: '#1F4E8C' },
  subtitle: { color: '#5F6773' },
  form: { padding: 16, borderRadius: 16, gap: 12, backgroundColor: '#FFFFFF' },
  errorBox: { backgroundColor: '#FCE4E2', borderRadius: 12, padding: 12, gap: 2 },
  errorTitle: { color: '#B3261E', fontWeight: '700' },
  errorText: { color: '#7A1C16' },
  buttonContent: { paddingVertical: 6 },
});
