import React, { useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { askQuestion, getChatHistory } from '../api/chat';
import { ChatMessage } from '../api/types';
import { NAVY, GOLD, TEXT_MUTED } from '../theme/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

interface ChatStrings {
  tryAsking: string;
  questions: string[];
  placeholder: string;
}

const CHAT_STRINGS: Record<string, ChatStrings> = {
  en: {
    tryAsking: 'Try asking:',
    questions: ['Can I resign anytime?', 'Will I lose PF?', 'Can employer terminate me?'],
    placeholder: 'Ask about this document...',
  },
  hi: {
    tryAsking: 'यह पूछकर देखें:',
    questions: [
      'क्या मैं कभी भी इस्तीफा दे सकता हूँ?',
      'क्या मुझे PF का नुकसान होगा?',
      'क्या नियोक्ता मुझे नौकरी से निकाल सकता है?',
    ],
    placeholder: 'इस दस्तावेज़ के बारे में पूछें...',
  },
  ta: {
    tryAsking: 'இதைக் கேளுங்கள்:',
    questions: [
      'நான் எப்போது வேண்டுமானாலும் ராஜினாமா செய்யலாமா?',
      'எனக்கு PF இழக்க நேரிடுமா?',
      'முதலாளி என்னை பணிநீக்கம் செய்யலாமா?',
    ],
    placeholder: 'இந்த ஆவணத்தைப் பற்றி கேளுங்கள்...',
  },
  te: {
    tryAsking: 'ఇలా అడగండి:',
    questions: [
      'నేను ఎప్పుడైనా రాజీనామా చేయవచ్చా?',
      'నాకు PF నష్టపోతానా?',
      'యజమాని నన్ను తొలగించగలరా?',
    ],
    placeholder: 'ఈ పత్రం గురించి అడగండి...',
  },
  bn: {
    tryAsking: 'জিজ্ঞাসা করে দেখুন:',
    questions: [
      'আমি কি যেকোনো সময় পদত্যাগ করতে পারি?',
      'আমি কি PF হারাবো?',
      'নিয়োগকর্তা কি আমাকে বরখাস্ত করতে পারে?',
    ],
    placeholder: 'এই নথি সম্পর্কে জিজ্ঞাসা করুন...',
  },
  mr: {
    tryAsking: 'असे विचारून पहा:',
    questions: [
      'मी कधीही राजीनामा देऊ शकतो का?',
      'मला PF गमवावा लागेल का?',
      'मालक मला कामावरून काढू शकतो का?',
    ],
    placeholder: 'या दस्तऐवजाबद्दल विचारा...',
  },
  gu: {
    tryAsking: 'આ પૂછી જુઓ:',
    questions: [
      'શું હું ગમે ત્યારે રાજીનામું આપી શકું?',
      'શું મને PF ગુમાવવો પડશે?',
      'શું નોકરીદાતા મને કાઢી શકે છે?',
    ],
    placeholder: 'આ દસ્તાવેજ વિશે પૂછો...',
  },
  kn: {
    tryAsking: 'ಹೀಗೆ ಕೇಳಿ ನೋಡಿ:',
    questions: [
      'ನಾನು ಯಾವಾಗ ಬೇಕಾದರೂ ರಾಜೀನಾಮೆ ನೀಡಬಹುದೇ?',
      'ನಾನು PF ಕಳೆದುಕೊಳ್ಳುತ್ತೇನೆಯೇ?',
      'ಉದ್ಯೋಗದಾತರು ನನ್ನನ್ನು ವಜಾಗೊಳಿಸಬಹುದೇ?',
    ],
    placeholder: 'ಈ ದಾಖಲೆಯ ಬಗ್ಗೆ ಕೇಳಿ...',
  },
  ml: {
    tryAsking: 'ഇങ്ങനെ ചോദിച്ചു നോക്കൂ:',
    questions: [
      'എനിക്ക് എപ്പോൾ വേണമെങ്കിലും രാജിവയ്ക്കാമോ?',
      'എനിക്ക് PF നഷ്ടപ്പെടുമോ?',
      'തൊഴിലുടമയ്ക്ക് എന്നെ പിരിച്ചുവിടാമോ?',
    ],
    placeholder: 'ഈ രേഖയെക്കുറിച്ച് ചോദിക്കൂ...',
  },
  pa: {
    tryAsking: 'ਇਹ ਪੁੱਛ ਕੇ ਦੇਖੋ:',
    questions: [
      'ਕੀ ਮੈਂ ਕਦੇ ਵੀ ਅਸਤੀਫਾ ਦੇ ਸਕਦਾ ਹਾਂ?',
      'ਕੀ ਮੈਨੂੰ PF ਦਾ ਨੁਕਸਾਨ ਹੋਵੇਗਾ?',
      'ਕੀ ਮਾਲਕ ਮੈਨੂੰ ਨੌਕਰੀ ਤੋਂ ਕੱਢ ਸਕਦਾ ਹੈ?',
    ],
    placeholder: 'ਇਸ ਦਸਤਾਵੇਜ਼ ਬਾਰੇ ਪੁੱਛੋ...',
  },
  ur: {
    tryAsking: 'یہ پوچھ کر دیکھیں:',
    questions: [
      'کیا میں کبھی بھی استعفیٰ دے سکتا ہوں؟',
      'کیا مجھے PF کا نقصان ہوگا؟',
      'کیا آجر مجھے ملازمت سے نکال سکتا ہے؟',
    ],
    placeholder: 'اس دستاویز کے بارے میں پوچھیں...',
  },
};

export default function ChatScreen({ route }: Props) {
  const { documentId, language } = route.params;
  const strings = CHAT_STRINGS[language || 'en'] || CHAT_STRINGS.en;
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
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
            <Text style={styles.suggestionsLabel}>{strings.tryAsking}</Text>
            {strings.questions.map((q) => (
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
      <View style={[styles.inputRow, { paddingBottom: 12 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          mode="outlined"
          outlineStyle={styles.inputOutline}
          placeholder={strings.placeholder}
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
