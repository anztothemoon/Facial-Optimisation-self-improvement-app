import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import {
  PrimaryButton,
  ScreenShell,
  SkeletonBlock,
} from '../components';
import { GlowCard } from '../components/dashboard';
import {
  subscribeProgressPhotos,
  uploadWeeklyProgressPhoto,
  type ProgressPhotoEntry,
} from '../services/progressPhotosFirestore';
import { colors } from '../theme';
import { hapticError, hapticSuccess } from '../services/haptics';

type Props = NativeStackScreenProps<MainStackParamList, 'ProgressPhotos'>;

export function ProgressPhotosScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ProgressPhotoEntry[]>([]);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [uploadingBody, setUploadingBody] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProgressPhotos(
      user.uid,
      24,
      (next) => {
        setEntries(next);
        setLoading(false);
        setLoadError(null);
      },
      () => {
        setLoadError('Could not load timeline right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const faceEntries = entries.filter((e) => e.type === 'face');
  const bodyEntries = entries.filter((e) => e.type === 'body');

  const faceCompare = useMemo(() => {
    const before = faceEntries[faceEntries.length - 1];
    const after = faceEntries[0];
    return { before, after };
  }, [faceEntries]);

  const bodyCompare = useMemo(() => {
    const before = bodyEntries[bodyEntries.length - 1];
    const after = bodyEntries[0];
    return { before, after };
  }, [bodyEntries]);

  const pickAndUpload = async (type: 'face' | 'body') => {
    if (!user) return;
    const setBusy = type === 'face' ? setUploadingFace : setUploadingBody;
    const granted = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted.granted) {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.88,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setBusy(true);
    try {
      await uploadWeeklyProgressPhoto(user.uid, result.assets[0].uri, type);
      void hapticSuccess();
      Alert.alert('Uploaded', `Weekly ${type} photo saved.`);
    } catch {
      void hapticError();
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell
      title="Progress photos"
      subtitle="Same lighting & distance each week makes before/after meaningful."
    >
      <GlowCard variant="amber">
        <Text style={styles.howTitle}>How it works</Text>
        <Text style={styles.howLine}>
          1. Upload a <Text style={styles.howBold}>face</Text> photo (neutral light, eye level).
        </Text>
        <Text style={styles.howLine}>
          2. Upload a <Text style={styles.howBold}>body</Text> photo (consistent mirror distance).
        </Text>
        <Text style={styles.howLine}>
          3. After 2+ uploads each, use the sliders — oldest vs newest week on file.
        </Text>
      </GlowCard>

      <GlowCard variant="cyan">
        <Text style={styles.sectionTitle}>Add this week’s photos</Text>
        <Text style={styles.uploadHint}>
          Pick from your library. One face and one body per check-in is enough.
        </Text>
        <View style={styles.actions}>
          <PrimaryButton
            label={uploadingFace ? 'Uploading...' : 'Upload face photo'}
            onPress={() => pickAndUpload('face')}
            disabled={uploadingFace}
          />
          <PrimaryButton
            label={uploadingBody ? 'Uploading...' : 'Upload body photo'}
            onPress={() => pickAndUpload('body')}
            disabled={uploadingBody}
            variant="ghost"
          />
        </View>
      </GlowCard>

      <GlowCard variant="violet">
        <Text style={styles.sectionTitle}>Face · before / after</Text>
        <Text style={styles.compareHint}>Drag the handle · older photo vs newer</Text>
        <ComparisonSlider
          beforeUri={faceCompare.before?.url}
          afterUri={faceCompare.after?.url}
          emptyLabel="Upload at least two face photos to compare."
        />
      </GlowCard>

      <GlowCard variant="emerald">
        <Text style={styles.sectionTitle}>Body · before / after</Text>
        <Text style={styles.compareHint}>Same idea as face — consistent weekly shots</Text>
        <ComparisonSlider
          beforeUri={bodyCompare.before?.url}
          afterUri={bodyCompare.after?.url}
          emptyLabel="Upload at least two body photos to compare."
        />
      </GlowCard>

      <GlowCard variant="amber">
        <Text style={styles.sectionTitle}>Timeline</Text>
        {loading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock style={styles.skelRow} />
            <SkeletonBlock style={styles.skelRow} />
            <SkeletonBlock style={styles.skelRow} />
          </View>
        ) : null}
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {[...entries].map((entry) => (
          <View key={entry.id} style={styles.timelineRow}>
            <Image source={{ uri: entry.url }} style={styles.timelineThumb} />
            <View style={styles.timelineMeta}>
              <Text style={styles.timelineTitle}>
                {entry.type === 'face' ? 'Face' : 'Body'} · {entry.weekKey}
              </Text>
              <Text style={styles.muted}>Stored in Firebase Storage</Text>
            </View>
          </View>
        ))}
        {entries.length === 0 ? (
          <Text style={styles.muted}>No progress photos yet.</Text>
        ) : null}
      </GlowCard>

      <PrimaryButton
        label="Log food & weight in Tracker"
        variant="ghost"
        onPress={() => navigation.navigate('Tracker')}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  howTitle: {
    color: colors.warning,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  howLine: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  howBold: { fontWeight: '800', color: colors.accent },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  uploadHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  compareHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  actions: {
    gap: 10,
  },
  compareWrap: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    position: 'relative',
  },
  compareBase: {
    ...StyleSheet.absoluteFillObject,
  },
  compareOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  compareImage: {
    width: '100%',
    height: '100%',
  },
  compareDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.accent,
  },
  compareHandle: {
    position: 'absolute',
    top: '45%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareHandleText: {
    color: colors.bg,
    fontWeight: '900',
    fontSize: 16,
  },
  compareLabelRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compareLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: colors.bgElevated,
  },
  timelineThumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: colors.bg,
  },
  timelineMeta: { flex: 1 },
  timelineTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  skeletonWrap: { gap: 8, marginBottom: 10 },
  skelRow: { height: 64, width: '100%', borderRadius: 12 },
});

type ComparisonSliderProps = {
  beforeUri?: string;
  afterUri?: string;
  emptyLabel: string;
};

function ComparisonSlider({ beforeUri, afterUri, emptyLabel }: ComparisonSliderProps) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (width > 0) {
      x.setValue(width / 2);
    }
  }, [width, x]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt) => {
          const next = Math.max(0, Math.min(width, evt.nativeEvent.locationX));
          x.setValue(next);
        },
      }),
    [width, x]
  );

  if (!beforeUri || !afterUri) {
    return <Text style={styles.muted}>{emptyLabel}</Text>;
  }

  return (
    <View
      style={styles.compareWrap}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={styles.compareBase}>
        <Image source={{ uri: beforeUri }} style={styles.compareImage} />
      </View>
      <Animated.View style={[styles.compareOverlay, { width: x }]}>
        <Image source={{ uri: afterUri }} style={styles.compareImage} />
      </Animated.View>
      <Animated.View style={[styles.compareDivider, { left: x }]} />
      <Animated.View style={[styles.compareHandle, { left: x }]}>
        <Text style={styles.compareHandleText}>↔</Text>
      </Animated.View>
      <View style={styles.compareLabelRow}>
        <Text style={styles.compareLabel}>Before</Text>
        <Text style={styles.compareLabel}>After</Text>
      </View>
    </View>
  );
}
