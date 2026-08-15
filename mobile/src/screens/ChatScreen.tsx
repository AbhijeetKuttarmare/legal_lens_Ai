import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { getChatHistory, streamAskQuestion, ChatUsage } from '../api/chat';
import { extractErrorMessage } from '../api/client';
import { ChatMessage } from '../api/types';
import { useAppTheme, AppTheme } from '../theme/ThemeContext';
import Markdown from '../components/Markdown';

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
  const { documentId, language, prefill } = route.params;
  const strings = CHAT_STRINGS[language || 'en'] || CHAT_STRINGS.en;
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState(prefill || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<Record<string, ChatUsage>>({});
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const listRef = useRef<FlatList>(null);

  const { data: history } = useQuery({
    queryKey: ['chat', documentId],
    queryFn: () => getChatHistory(documentId),
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  const send = async (q: string) => {
    if (!q.trim() || sending) return;
    const trimmed = q.trim();
    setQuestion('');
    setSending(true);
    setError(null);
    const assistantId = `local-${Date.now()}-a`;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: trimmed, createdAt: new Date().toISOString() },
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    try {
      const usage = await streamAskQuestion(documentId, trimmed, (chunk) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      });
      if (usage) {
        setTokenUsage((prev) => ({ ...prev, [assistantId]: usage }));
      }
    } catch (e) {
      setMessages((prev) => prev.slice(0, -2));
      setQuestion(trimmed);
      setError(extractErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 12 }}
        data={messages}
        keyExtractor={(item: ChatMessage) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.suggestions}>
            <View style={styles.assistantIconWrap}>
              <MaterialCommunityIcons name="robot-outline" size={22} color={t.text} />
            </View>
            <Text style={styles.suggestionsLabel}>{strings.tryAsking}</Text>
            {strings.questions.map((q) => (
              <Pressable key={q} style={styles.suggestionChip} onPress={() => send(q)}>
                <Text style={styles.suggestionChipText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item, index }) => {
          const isStreamingPlaceholder =
            item.role === 'assistant' && item.content === '' && sending && index === messages.length - 1;
          const usage = tokenUsage[item.id];
          return (
            <View style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                {item.role === 'user' ? (
                  <Text style={styles.userText}>{item.content}</Text>
                ) : isStreamingPlaceholder ? (
                  <ActivityIndicator size="small" color={t.textMuted} />
                ) : (
                  <Markdown text={item.content} color={t.text} boldColor={t.text} />
                )}
              </View>
              {usage && (
                <Text style={styles.usageText}>
                  {usage.inputTokens + usage.outputTokens} tokens ({usage.inputTokens} in · {usage.outputTokens} out)
                </Text>
              )}
            </View>
          );
        }}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
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
          style={[styles.sendButton, (sending || !question.trim()) && { opacity: 0.5 }]}
          onPress={() => send(question)}
          disabled={sending || !question.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color={t.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: t.bg },
    list: { flex: 1, paddingHorizontal: 14 },
    suggestions: { padding: 12, alignItems: 'center', marginTop: 20 },
    assistantIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: t.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    suggestionsLabel: { color: t.textMuted, marginBottom: 12 },
    suggestionChip: {
      backgroundColor: t.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 10,
      width: '100%',
    },
    suggestionChipText: { color: t.text, fontWeight: '600', textAlign: 'center' },
    bubble: { padding: 13, borderRadius: 16, marginBottom: 4, maxWidth: '85%' },
    userBubble: { backgroundColor: t.buttonColor, borderBottomRightRadius: 4 },
    assistantBubble: {
      backgroundColor: t.surfaceAlt,
      borderWidth: 1,
      borderColor: t.border,
      borderBottomLeftRadius: 4,
    },
    userText: { color: t.onAccent },
    usageText: { fontSize: 10.5, color: t.textMuted, marginBottom: 10, paddingHorizontal: 4 },
    errorText: { color: '#DC2626', fontSize: 12.5, paddingHorizontal: 14, marginBottom: 8 },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
    input: { flex: 1, backgroundColor: t.surface },
    inputOutline: { borderRadius: 24 },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.buttonColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
