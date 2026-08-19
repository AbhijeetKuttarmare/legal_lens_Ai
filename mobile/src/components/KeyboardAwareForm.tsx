import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

// The one correct KeyboardAvoidingView + ScrollView pairing for any
// screen with text inputs — fix keyboard-overlap bugs here once instead
// of per-screen. Any screen with a TextInput should wrap its form
// content in this rather than a raw View/ScrollView (a plain View
// without a ScrollView lets the keyboard squash/hide fields below the
// fold instead of letting the user scroll to them).
export default function KeyboardAwareForm({ children, style, contentContainerStyle }: Props) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
