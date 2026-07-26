import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface Slide {
  source: number;
  durationMs: number | null; // null = wait for user tap
  skippable: boolean;
}

const SLIDES: Slide[] = [
  { source: require('../../assets/SplashscreenAI.png'), durationMs: 1700, skippable: false },
  { source: require('../../assets/Splashscreen2.png'), durationMs: 2600, skippable: true },
  { source: require('../../assets/Splash3.png'), durationMs: null, skippable: false },
];

interface Props {
  onFinish: () => void;
}

export default function AppLoadingSplash({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const advance = (toIndex?: number) => {
    const next = toIndex ?? index + 1;
    if (next >= SLIDES.length) {
      onFinish();
      return;
    }
    Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    const slide = SLIDES[index];
    if (slide.durationMs == null) return undefined;
    const timer = setTimeout(() => advance(), slide.durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const slide = SLIDES[index];

  return (
    <Pressable
      style={styles.container}
      onPress={() => advance(index === SLIDES.length - 1 ? SLIDES.length : undefined)}
    >
      <Animated.Image source={slide.source} style={[styles.image, { opacity }]} resizeMode="cover" />
      {slide.skippable && (
        <Pressable style={styles.skip} onPress={() => advance(SLIDES.length - 1)}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  skip: { position: 'absolute', top: 48, right: 24, paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
