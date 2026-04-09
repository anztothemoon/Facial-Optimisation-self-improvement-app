import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

type Props = {
  imageUri?: string;
  /** When no image, show stronger CTA styling */
  compact?: boolean;
};

/**
 * Face “scan” preview: optional user photo with animated scan beam (visual only, not biometric ID).
 */
export function FaceScanPreview({ imageUri, compact }: Props) {
  const beamY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beamY, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(beamY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [beamY]);

  const translateY = beamY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const frameStyle: StyleProp<ImageStyle> = [
    styles.frame,
    compact && styles.frameCompact,
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.previewBox}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={frameStyle} resizeMode="cover" />
            <Animated.View
              style={[styles.beamWrap, { transform: [{ translateY }] }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['transparent', 'rgba(91,231,255,0.35)', 'transparent']}
                style={styles.beam}
              />
            </Animated.View>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </>
        ) : (
          <View style={[styles.placeholder, compact && styles.placeholderCompact]}>
            <Text style={styles.phEmoji}>📷</Text>
            <Text style={styles.phTitle}>No face reference yet</Text>
            <Text style={styles.phSub}>
              Add a front-facing progress photo to anchor scores to your latest scan.
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.caption}>
        {imageUri
          ? 'Live preview · scores use this image plus your goals'
          : 'Scores use a local model until a face photo is available'}
      </Text>
    </View>
  );
}

const corner = {
  position: 'absolute' as const,
  width: 18,
  height: 18,
  borderColor: colors.accent,
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  previewBox: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.bgElevated,
    minHeight: 140,
    position: 'relative',
  },
  frame: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surface,
  },
  frameCompact: { height: 120 },
  beamWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 36,
  },
  beam: { flex: 1, width: '100%' },
  cornerTL: { ...corner, top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: {
    ...corner,
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    ...corner,
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    ...corner,
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  placeholder: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  placeholderCompact: { minHeight: 120, padding: 14 },
  phEmoji: { fontSize: 32, marginBottom: 8 },
  phTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  phSub: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  caption: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});
