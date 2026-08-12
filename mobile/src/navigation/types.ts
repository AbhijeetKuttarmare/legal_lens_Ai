export type AuthStackParamList = {
  PhoneAuth: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Scan: undefined;
  Subscription: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Upload: undefined;
  Report: { documentId: string };
  Chat: { documentId: string; fileName: string; language?: string };
  EditProfile: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  HelpSupport: undefined;
  Checkout: { plan: 'PRO' | 'ENTERPRISE'; planName: string };
  Compare: undefined;
  Templates: undefined;
};

// Screens nested inside the bottom tabs need to navigate to stack-only routes
// (Report, Chat, Upload) — React Navigation resolves these via event bubbling
// to the parent stack at runtime, so this merged type just keeps them typed.
export type RootNavigationParamList = MainStackParamList & TabParamList;
