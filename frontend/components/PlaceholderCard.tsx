import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SurfaceCard } from './SurfaceCard';
import { colors } from '../theme';

type Props = { title: string; children?: React.ReactNode };

/** Legacy alias — uses dark SurfaceCard */
export function PlaceholderCard({ title, children }: Props) {
  return (
    <SurfaceCard title={title}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={styles.body}>{children}</Text>
      ) : (
        children
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
