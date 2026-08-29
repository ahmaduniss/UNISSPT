import { useLocalSearchParams } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

export default function CoachPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);

  const photosQuery = trpc.progressPhotos.list.useQuery({ clientId: id }, { enabled: !!id });
  const photos = photosQuery.data ?? [];

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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Camera color={Colors.dark.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>Your coach hasn&apos;t added any progress photos yet</Text>
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
                <Text style={styles.modalDate}>{formatDate(viewing.takenAt)}</Text>
                {viewing.weightKg != null && (
                  <Text style={styles.modalWeight}>{viewing.weightKg} kg</Text>
                )}
                {viewing.notes && <Text style={styles.modalNotes}>{viewing.notes}</Text>}
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
    textAlign: 'center' as const,
    paddingHorizontal: 30,
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
  },
});
