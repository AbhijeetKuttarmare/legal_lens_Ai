export type AuthStackParamList = {
  PhoneAuth: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Upload: undefined;
  Report: { documentId: string };
  Chat: { documentId: string; fileName: string };
  History: undefined;
};
