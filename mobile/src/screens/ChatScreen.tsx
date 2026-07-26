import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { askQuestion, getChatHistory } from '../api/chat';
import { ChatMessage } from '../api/types';
import { NAVY, GOLD, TEXT_MUTED } from '../theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

const SUGGESTED_QUESTIONS = [
  'Can I resign anytime?',
  'Will I lose PF?',
  'Can employer terminate me?',
];

export default function ChatScreen({ route }: Props) {
  const { documentId } = route.params;
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');

  const { data: messages } = useQuery({
    queryKey: ['chat', documentId],
    queryFn: () => getChatHistory(documentId),
  });

  const mutation = useMutation({
    mutationFn: (q: string) => askQuestion(documentId, q),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', documentId] });
    },
  });

  const send = (q: string) => {
    if (!q.trim() || mutation.isPending) return;
    setQuestion('');
    mutation.mutate(q.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 12 }}
        data={messages || []}
        keyExtractor={(item: ChatMessage) => item.id}
        ListEmptyComponent={
          <View style={styles.suggestions}>
            <View style={styles.assistantIconWrap}>
              <MaterialCommunityIcons name="robot-outline" size={22} color={NAVY} />
            </View>
            <Text style={styles.suggestionsLabel}>Try asking:</Text>
            {SUGGESTED_QUESTIONS.map((q) => (
              <Pressable key={q} style={styles.suggestionChip} onPress={() => send(q)}>
                <Text style={styles.suggestionChipText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
              {item.content}
            </Text>
          </View>
        )}
      />
      {mutation.isPending && (
        <ActivityIndicator style={{ marginBottom: 8 }} color={NAVY} />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          mode="outlined"
          outlineStyle={styles.inputOutline}
          placeholder="Ask about this document..."
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={() => send(question)}
        />
        <Pressable
          style={[styles.sendButton, (mutation.isPending || !question.trim()) && { opacity: 0.5 }]}
          onPress={() => send(question)}
          disabled={mutation.isPending || !question.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color={NAVY} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F5F9' },
  list: { flex: 1, paddingHorizontal: 14 },
  suggestions: { padding: 12, alignItems: 'center', marginTop: 20 },
  assistantIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  suggestionsLabel: { color: TEXT_MUTED, marginBottom: 12 },
  suggestionChip: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
  },
  suggestionChipText: { color: NAVY, fontWeight: '600', textAlign: 'center' },
  bubble: { padding: 13, borderRadius: 16, marginBottom: 10, maxWidth: '85%' },
  userBubble: { backgroundColor: NAVY, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: 'white', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userText: { color: 'white' },
  assistantText: { color: '#1F2937' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: 'white' },
  inputOutline: { borderRadius: 24 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
