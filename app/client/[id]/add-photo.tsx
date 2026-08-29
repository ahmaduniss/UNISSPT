import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, ImagePlus, Upload } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

const BUCKET = 'progress-photos';

export default function AddProgressPhotoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useApp();
  const utils = trpc.useUtils();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const createPhotoMutation = trpc.progressPhotos.create.useMutation({
    onSuccess: () => {
      utils.progressPhotos.list.invalidate({ clientId: id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (error) => {
      Alert.alert('Could not save photo', error.message);
      setIsUploading(false);
    },
  });

  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow access to your ${source === 'camera' ? 'camera' : 'photos'}.`);
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!imageUri || !userId) return;
    setIsUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const path = `${userId}/${id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw new Error(uploadError.message);

      createPhotoMutation.mutate({
        clientId: id,
        storagePath: path,
        takenAt: new Date().toISOString(),
        weightKg: weight.trim() ? Number(weight) : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      Alert.alert('Upload failed', message);
      setIsUploading(false);
    }
  }, [imageUri, userId, id, weight, notes, createPhotoMutation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {imageUri ? (
          <Pressable onPress={() => setImageUri(null)} style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <Text style={styles.changeText}>Tap to change photo</Text>
          </Pressable>
        ) : (
          <View style={styles.pickerRow}>
            <Pressable
              onPress={() => pickImage('camera')}
              style={({ pressed }) => [styles.pickerBtn, pressed && { opacity: 0.8 }]}
            >
              <Camera color={Colors.dark.accent} size={26} />
              <Text style={styles.pickerBtnText}>Camera</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage('library')}
              style={({ pressed }) => [styles.pickerBtn, pressed && { opacity: 0.8 }]}
            >
              <ImagePlus color={Colors.dark.accent} size={26} />
              <Text style={styles.pickerBtnText}>Library</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.label}>WEIGHT (optional, kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="e.g. 78"
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Text style={styles.label}>NOTES (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Week 6, after cut..."
          placeholderTextColor={Colors.dark.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleUpload}
          disabled={!imageUri || isUploading}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            (!imageUri || isUploading) && { opacity: 0.5 },
          ]}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Upload color="#fff" size={18} />
          )}
          <Text style={styles.saveBtnText}>{isUploading ? 'Uploading...' : 'Save Photo'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pickerRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 8,
  },
  pickerBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  previewWrap: {
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  preview: {
    width: '100%' as const,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: Colors.dark.card,
  },
  changeText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  notesInput: {
    minHeight: 80,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
