import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Plus, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import type { ProgressPhoto } from '@/types/workout';

const GAP = 8;
const NUM_COLS = 3;
const screenWidth = Dimensions.get('window').width;
const tileSize = (screenWidth - 40 - GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function ClientPhotosScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);

  const photosQuery = trpc.progressPhotos.list.useQuery({ clientId: id }, { enabled: !!id });
  const photos = photosQuery.data ?? [];

  const deleteMutation = trpc.progressPhotos.delete.useMutation({
    onSuccess: () => {
      utils.progressPhotos.list.invalidate({ clientId: id });
      setViewing(null);
    },
    onError: (error) => Alert.alert('Could not delete photo', error.message),
  });

  const handleDelete = useCallback((photo: ProgressPhoto) => {
    Alert.alert('Delete Photo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteMutation.mutate({ id: photo.id });
        },
      },
    ]);
  }, [deleteMutation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ gap: GAP }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        ListHeaderComponent={
          <Pressable
            onPress={() => router.push(`/client/${id}/add-photo` as any)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          >
            <Plus color="#fff" size={18} />
            <Text style={styles.addBtnText}>Add Progress Photo</Text>
          </Pressable>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Camera color={Colors.dark.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>Track visual progress over time</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setViewing(item)}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
          >
            <Image source={{ uri: item.url }} style={styles.tileImage} />
          </Pressable>
        )}
      />

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalCloseBtn} onPress={() => setViewing(null)} hitSlop={12}>
            <X color="#fff" size={24} />
          </Pressable>
          {viewing && (
            <>
              <Image source={{ uri: viewing.url }} style={styles.modalImage} resizeMode="contain" />
              <View style={styles.modalFooter}>
                <View>
                  <Text style={styles.modalDate}>{formatDate(viewing.takenAt)}</Text>
                  {viewing.weightKg != null && (
                    <Text style={styles.modalWeight}>{viewing.weightKg} kg</Text>
                  )}
                  {viewing.notes && <Text style={styles.modalNotes}>{viewing.notes}</Text>}
                </View>
                <Pressable onPress={() => handleDelete(viewing)} style={styles.modalDeleteBtn} hitSlop={8}>
                  <Trash2 color={Colors.dark.danger} size={18} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  listContent: {
    padding: 20,
  },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  tile: {
    borderRadius: 10,
    overflow: 'hidden' as const,
    backgroundColor: Colors.dark.card,
  },
  tileImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center' as const,
  },
  modalCloseBtn: {
    position: 'absolute' as const,
    top: 60,
    right: 24,
    zIndex: 1,
  },
  modalImage: {
    width: '100%' as const,
    height: '75%' as const,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalDate: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalWeight: {
    fontSize: 13,
    color: Colors.dark.accentLight,
    marginTop: 2,
    fontWeight: '600' as const,
  },
  modalNotes: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    maxWidth: 260,
  },
  modalDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
