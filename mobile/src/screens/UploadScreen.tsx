import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { uploadDocument, PickedFile } from '../api/documents';
import { extractErrorMessage } from '../api/client';

type Props = NativeStackScreenProps<MainStackParamList, 'Upload'>;

export default function UploadScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onMutate: () => {
      setError(null);
      setStatusText('Extracting text and analyzing with AI. This can take up to a minute...');
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigation.replace('Report', { documentId: report.id });
    },
    onError: (e) => setError(extractErrorMessage(e)),
    onSettled: () => setStatusText(''),
  });

  const pickAndUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file: PickedFile = {
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/pdf',
    };
    mutation.mutate(file);
  };

  const pickAndUploadImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required to scan a document.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file: PickedFile = {
      uri: asset.uri,
      name: asset.fileName || 'scan.jpg',
      mimeType: asset.mimeType || 'image/jpeg',
    };
    mutation.mutate(file);
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Upload a Document
      </Text>
      <Text style={styles.subtitle}>
        Supported: PDF, DOCX. (Image/camera scan support requires OCR, coming soon.)
      </Text>

      <Button
        mode="contained"
        style={styles.button}
        onPress={pickAndUploadFile}
        disabled={mutation.isPending}
      >
        Choose PDF / DOCX
      </Button>

      <Button
        mode="outlined"
        style={styles.button}
        onPress={pickAndUploadImage}
        disabled={mutation.isPending}
      >
        Scan with Camera (JPG/PNG)
      </Button>

      {mutation.isPending && (
        <View style={styles.loadingBox}>
          <ActivityIndicator animating size="large" />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { marginBottom: 4 },
  subtitle: { color: '#666', marginBottom: 24 },
  button: { marginBottom: 12, paddingVertical: 4 },
  loadingBox: { marginTop: 24, alignItems: 'center' },
  statusText: { marginTop: 12, textAlign: 'center', color: '#444' },
  errorText: { color: '#DC2626', marginTop: 16 },
});
