import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  onSelect: (question: string) => void;
}

export function IcebreakerBar({ onSelect }: Props) {
  const { t } = useTranslation();

  const questions = [
    t('icebreakers.q1'),
    t('icebreakers.q2'),
    t('icebreakers.q3'),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('icebreakers.title')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {questions.map((q, i) => (
          <TouchableOpacity key={i} style={styles.chip} onPress={() => onSelect(q)}>
            <Text style={styles.chipText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1929',
  },
  title: {
    color: '#6C5CE7', fontSize: 12, fontWeight: '700', paddingHorizontal: 16,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: '#1A1929', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#6C5CE7',
    maxWidth: 200,
  },
  chipText: { color: '#FFFFFE', fontSize: 13, lineHeight: 18 },
});
