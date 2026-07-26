import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { ActivityIndicator, IconButton, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { askQuestion, getChatHistory } from '../api/chat';
import { ChatMessage } from '../api/types';

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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        style={styles.list}
        data={messages || []}
        keyExtractor={(item: ChatMessage) => item.id}
        ListEmptyComponent={
          <View style={styles.suggestions}>
            <Text style={{ color: '#666', marginBottom: 8 }}>Try asking:</Text>
            {SUGGESTED_QUESTIONS.map((q) => (
              <Text key={q} style={styles.suggestionChip} onPress={() => send(q)}>
                {q}
              </Text>
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
            <Text style={item.role === 'user' ? { color: 'white' } : undefined}>
              {item.content}
            </Text>
          </View>
        )}
      />
      {mutation.isPending && <ActivityIndicator style={{ marginBottom: 8 }} />}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          mode="outlined"
          placeholder="Ask about this document..."
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={() => send(question)}
        />
        <IconButton icon="send" onPress={() => send(question)} disabled={mutation.isPending} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, padding: 12 },
  suggestions: { padding: 12 },
  suggestionChip: {
    backgroundColor: '#EEF2FF',
    color: '#1E3A8A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  bubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '85%' },
  userBubble: { backgroundColor: '#1E3A8A', alignSelf: 'flex-end' },
  assistantBubble: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1 },
});
