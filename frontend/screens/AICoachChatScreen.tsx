import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useCoachContext } from '../hooks/useCoachContext';
import { GlassPanel, PrimaryButton, ScreenShell } from '../components';
import { GlowCard } from '../components/dashboard';
import { fetchChatCoach, type ChatMessage } from '../services/api';
import { buildCoachSystemPrompt } from '../services/coachContext';
import { fetchCoachWithUserKey } from '../services/openaiDirectChat';
import {
  getByokEnabled,
  getUserOpenAIKey,
} from '../services/userOpenAISettings';
import { productConfig } from '../config/product';
import { colors } from '../theme';
import { hapticError, hapticSuccess } from '../services/haptics';

type Props = NativeStackScreenProps<MainStackParamList, 'AICoachChat'>;

const SUGGESTIONS = [
  'How do I improve my jawline?',
  'What haircut suits me?',
  'How can I improve skin?',
];

export function AICoachChatScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { context: coachContext, ready: coachReady } = useCoachContext(user);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        `Hi — I use your profile and goals for tailored answers.\n\n${productConfig.coach.welcomeHint}\n\nAsk about face, body, fitness, skin, or style.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  const pushMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      messagesRef.current = next;
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      setLoading(true);
      const userMsg: ChatMessage = { role: 'user', content: trimmed };
      pushMessage(userMsg);
      setInput('');

      try {
        if (!user) {
          setError('You need to be signed in to use the coach.');
          pushMessage({
            role: 'assistant',
            content: 'Please sign in to continue.',
          });
          return;
        }
        const historyForApi = messagesRef.current
          .slice(0, -1)
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const byok = await getByokEnabled();
        const ownKey = await getUserOpenAIKey();

        let reply: string;
        let provider: string | undefined;
        let warning: string | undefined;

        if (byok && ownKey) {
          if (!coachReady) {
            throw new Error('Loading your profile for the coach…');
          }
          const systemPrompt = buildCoachSystemPrompt(coachContext);
          const r = await fetchCoachWithUserKey(
            ownKey,
            systemPrompt,
            historyForApi,
            trimmed
          );
          reply = r.reply;
          provider = 'openai-byok';
        } else {
          const token = await user.getIdToken();
          const res = await fetchChatCoach(token, trimmed, historyForApi);
          reply = res.reply;
          provider = res.provider;
          warning = res.warning;
        }

        const suffix =
          provider === 'basic-free'
            ? '\n\nUsing basic coach mode (full AI unavailable). Check API configuration if this persists.'
            : provider === 'openai-byok'
              ? '\n\nUsing your OpenAI key on this device — usage bills to your OpenAI account.'
              : '';
        const assistantText =
          reply + (warning ? `\n\n${warning}` : '') + suffix;
        void hapticSuccess();
        pushMessage({ role: 'assistant', content: assistantText });
      } catch (e) {
        void hapticError();
        setError(e instanceof Error ? e.message : 'Could not reach coach');
        pushMessage({
          role: 'assistant',
          content:
            'Something went wrong. Check that the API is running.',
        });
      } finally {
        setLoading(false);
      }
    },
    [user, loading, pushMessage]
  );

  const sendCurrent = () => send(input);

  return (
    <ScreenShell
      title="AI Coach"
      subtitle="Server AI or your own OpenAI key (Profile → AI Coach). Your profile personalizes replies."
      scrollable={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <GlowCard variant="cyan" padding={12}>
          <Text style={styles.hint}>Try asking:</Text>
          <GlassPanel intensity={22} style={styles.suggestionGlass}>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={styles.chip}
                  onPress={() => send(s)}
                  disabled={loading}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </GlassPanel>
        </GlowCard>

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <FlatList
          ref={listRef}
          style={styles.list}
          data={messages}
          keyExtractor={(_, i) => `${i}`}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleWrap,
                item.role === 'user' ? styles.alignEnd : styles.alignStart,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.coachBubble,
                ]}
              >
                <Text
                  style={
                    item.role === 'user' ? styles.userText : styles.coachText
                  }
                >
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            loading ? (
              <ActivityIndicator color={colors.accent} style={styles.spin} />
            ) : null
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask your coach..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            editable={!loading}
          />
          <Pressable
            style={[styles.sendBtn, loading && styles.sendDisabled]}
            onPress={sendCurrent}
            disabled={loading || !input.trim()}
          >
            <Text style={styles.sendTxt}>Send</Text>
          </Pressable>
        </View>

        <PrimaryButton
          label="Back to dashboard"
          variant="ghost"
          onPress={() => navigation.navigate('Dashboard')}
        />
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flex: 1, marginBottom: 8 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionGlass: { marginBottom: 0 },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  err: { color: colors.danger, marginBottom: 8, fontSize: 13 },
  bubbleWrap: {
    marginBottom: 10,
    width: '100%',
  },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '92%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  coachBubble: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.surfaceBorder,
  },
  userBubble: {
    backgroundColor: colors.accentMuted,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  coachText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  userText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  spin: { marginVertical: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  sendDisabled: { opacity: 0.45 },
  sendTxt: { color: colors.bg, fontWeight: '800', fontSize: 15 },
});
