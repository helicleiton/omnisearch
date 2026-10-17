import { Linking, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Divider, List, ProgressBar, Text } from 'react-native-paper';
import { STATUS_META } from '../theme/theme';
import type { DetailSection, SearchResult } from '../types/api';
import { TYPE_LABELS } from '../utils/searchTypes';

interface Props {
  result: SearchResult;
  onNewSearch: () => void;
}

export function ResultCard({ result, onNewSearch }: Props) {
  const meta = STATUS_META[result.status];

  return (
    <View style={styles.container}>
      {/* --- Resumo Geral --- */}
      <Card mode="elevated" style={styles.card}>
        <Card.Title
          title={meta.label}
          titleVariant="titleLarge"
          titleStyle={{ color: meta.color, fontWeight: '700' }}
          subtitle={`${TYPE_LABELS[result.type]}${result.autoDetected ? ' (detectado)' : ''} · ${result.maskedQuery}`}
          left={(props) => <Avatar.Icon {...props} icon={meta.icon} color={meta.color} style={{ backgroundColor: meta.background }} />}
        />
        <Card.Content style={styles.gap}>
          {result.status !== 'unverified' && (
            <View>
              <View style={styles.scoreRow}>
                <Text variant="labelLarge">Score de Exposição</Text>
                <Text variant="titleMedium" style={{ color: meta.color, fontWeight: '700' }}>
                  {result.exposureScore}/100
                </Text>
              </View>
              <ProgressBar progress={result.exposureScore / 100} color={meta.color} style={styles.progress} />
            </View>
          )}
          <Text variant="bodyMedium">{result.summary}</Text>
          {result.isMock && (
            <Chip icon="flask-outline" compact style={styles.mockChip}>
              Dados simulados
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* --- Detalhes Encontrados --- */}
      <Card mode="outlined" style={styles.card}>
        <Card.Title title="Detalhes encontrados" titleVariant="titleMedium" />
        <Card.Content>
          {result.sections.length === 0 ? (
            <View style={styles.empty}>
              <Avatar.Icon size={48} icon="magnify-close" style={styles.emptyIcon} />
              <Text variant="bodyMedium" style={styles.muted}>
                Nenhum resultado encontrado para esta consulta.
              </Text>
            </View>
          ) : (
            result.sections.map((section, i) => (
              <SectionBlock key={`${section.title}-${i}`} section={section} isLast={i === result.sections.length - 1} />
            ))
          )}
        </Card.Content>
      </Card>

      {/* --- Serviços oficiais para a própria pessoa consultar --- */}
      {result.links.length > 0 && (
        <Card mode="outlined" style={styles.card}>
          <Card.Title title="Consulte o seu próprio CPF (grátis)" titleVariant="titleMedium" />
          {result.links.map((link) => (
            <List.Item
              key={link.url}
              title={link.label}
              description={link.description}
              left={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={() => void Linking.openURL(link.url)}
              accessibilityRole="link"
            />
          ))}
        </Card>
      )}

      <Text variant="bodySmall" style={styles.footer}>
        Fontes: {result.sources.join(', ')} · {new Date(result.searchedAt).toLocaleString('pt-BR')}
        {'\n'}
        {result.disclaimer}
      </Text>

      <Button mode="contained" icon="refresh" onPress={onNewSearch} contentStyle={styles.buttonContent}>
        Nova Consulta
      </Button>
    </View>
  );
}

function SectionBlock({ section, isLast }: { section: DetailSection; isLast: boolean }) {
  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        {section.title}
      </Text>
      {section.items.map((item) => (
        <View key={item.label} style={styles.itemRow}>
          <Text variant="bodySmall" style={[styles.muted, styles.itemLabel]}>
            {item.label}
          </Text>
          <Text variant="bodyMedium" style={styles.itemValue} selectable>
            {item.value}
          </Text>
        </View>
      ))}
      {!isLast && <Divider style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { backgroundColor: '#FFFFFF' },
  gap: { gap: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progress: { height: 8, borderRadius: 4 },
  mockChip: { alignSelf: 'flex-start' },
  section: { paddingTop: 4 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  itemRow: { flexDirection: 'row', paddingVertical: 4, gap: 12 },
  itemLabel: { flex: 2 },
  itemValue: { flex: 3, textAlign: 'right' },
  divider: { marginTop: 10, marginBottom: 6 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyIcon: { backgroundColor: '#E8ECF2' },
  muted: { color: '#5F6773' },
  footer: { color: '#5F6773', textAlign: 'center', paddingHorizontal: 8 },
  buttonContent: { paddingVertical: 6 },
});
