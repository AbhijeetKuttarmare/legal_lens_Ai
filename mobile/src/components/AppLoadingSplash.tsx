import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICON = require('../../assets/icon-glyph.png');
const GOLD = '#B08D57';

// Slide 1 and 3 render live "Clauzera AI" text via code (not baked into an
// image) so a future rename never requires regenerating artwork. Slide 2 is
// a photographic scan illustration with no brand-name text in it, so it
// stays a plain image.
function WelcomeSlide() {
  return (
    <View style={styles.welcomePage}>
      <View style={styles.iconGlow}>
        <View style={styles.iconTile}>
          <Image source={ICON} style={styles.iconImage} resizeMode="contain" />
        </View>
      </View>
      <Text style={styles.brandTitle}>
        Clauzera <Text style={{ color: GOLD }}>AI</Text>
      </Text>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDot} />
        <View style={styles.dividerLine} />
      </View>
      <Text style={styles.tagline}>Understand. Analyze. Empower.</Text>
      <LoadingBar />
    </View>
  );
}

function LoadingBar() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 1500, useNativeDriver: false }).start();
  }, [progress]);
  return (
    <View style={styles.loadingWrap}>
      <Text style={styles.loadingText}>Loading...</Text>
      <View style={styles.loadingTrack}>
        <Animated.View
          style={[
            styles.loadingFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

const FEATURES: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  desc: string;
}[] = [
  { icon: 'text-box-search-outline', title: 'Understand', desc: 'Simplify complex\nlegal documents.' },
  { icon: 'brain', title: 'Analyze', desc: 'AI-powered insights\nin seconds.' },
  { icon: 'shield-check-outline', title: 'Secure', desc: 'Your data is private\nand protected.' },
];

function GetStartedSlide() {
  return (
    <View style={styles.getStartedPage}>
      <MaterialCommunityIcons
        name="scale-balance"
        size={180}
        color="rgba(212,175,55,0.08)"
        style={styles.pillarDecoration}
      />

      <View style={styles.getStartedIconTile}>
        <Image source={ICON} style={styles.iconImage} resizeMode="contain" />
      </View>
      <Text style={styles.brandTitle}>
        Clauzera <Text style={{ color: GOLD }}>AI</Text>
      </Text>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDot} />
        <View style={styles.dividerLine} />
      </View>
      <Text style={styles.tagline}>
        Understand. Analyze. <Text style={{ color: GOLD }}>Empower.</Text>
      </Text>

      <View style={styles.featureRow}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCol}>
            <View style={styles.featureIconWrap}>
              <MaterialCommunityIcons name={f.icon} size={22} color={GOLD} />
            </View>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.getStartedButton}>
        <Text style={styles.getStartedButtonText}>Get Started</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color={NAVY} />
      </View>
      <Text style={styles.exploreLink}>
        Explore Features <MaterialCommunityIcons name="chevron-right" size={13} color={GOLD} />
      </Text>
    </View>
  );
}

const NAVY = '#0B1220';

interface Slide {
  source?: number;
  Component?: React.ComponentType;
  durationMs: number | null; // null = wait for user tap
  skippable: boolean;
}

const SLIDES: Slide[] = [
  { Component: WelcomeSlide, durationMs: 1700, skippable: false },
  { source: require('../../assets/Splashscreen2.png'), durationMs: 2600, skippable: true },
  { Component: GetStartedSlide, durationMs: null, skippable: false },
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
  const SlideComponent = slide.Component;

  return (
    <Pressable
      style={styles.container}
      onPress={() => advance(index === SLIDES.length - 1 ? SLIDES.length : undefined)}
    >
      <Animated.View style={[styles.slideWrap, { opacity }]}>
        {SlideComponent ? (
          <SlideComponent />
        ) : (
          <Image source={slide.source} style={styles.image} resizeMode="cover" />
        )}
      </Animated.View>
      {slide.skippable && (
        <Pressable style={styles.skip} onPress={() => advance(SLIDES.length - 1)}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  slideWrap: { flex: 1 },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  skip: { position: 'absolute', top: 48, right: 24, paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { color: 'white', fontWeight: '700', fontSize: 15 },

  welcomePage: { flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37,99,235,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  iconTile: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: '#101c33',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  iconImage: { width: '100%', height: '100%' },
  brandTitle: { color: 'white', fontSize: 32, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, width: 180 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(212,175,55,0.4)' },
  dividerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD },
  tagline: { color: 'white', fontSize: 15, marginTop: 14 },
  loadingWrap: { position: 'absolute', bottom: 64, alignItems: 'center', width: 220 },
  loadingText: { color: '#8D97A8', fontSize: 13, marginBottom: 10 },
  loadingTrack: { width: '100%', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  loadingFill: { height: '100%', backgroundColor: GOLD, borderRadius: 2 },

  getStartedPage: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  pillarDecoration: { position: 'absolute', right: -30, top: 60 },
  getStartedIconTile: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#101c33',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
  },
  featureRow: { flexDirection: 'row', width: '100%', marginTop: 36 },
  featureCol: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#101c33',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: { color: 'white', fontWeight: '700', fontSize: 13.5 },
  featureDesc: { color: '#8D97A8', fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    marginTop: 'auto',
  },
  getStartedButtonText: { color: NAVY, fontWeight: '800', fontSize: 16 },
  exploreLink: { color: 'white', fontSize: 13, marginTop: 16, opacity: 0.8 },
});
