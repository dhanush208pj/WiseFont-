import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  Image,
  Platform,
} from 'react-native';
import {PanResponder} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── THEME ────────────────────────────────────────────────────────────────────
const BG = '#1f3a34';
const LIGHT = '#f4f8f9';
const ACCENT = '#c8e6c0';
const DARK_CARD = '#162d28';
const SHADOW_DARK = '#0d1f1b';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = 280;

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── DRAWING CANVAS ───────────────────────────────────────────────────────────
import {useRef as useRefCanvas} from 'react';

function DrawingCanvas({
  letter,
  onSave,
  existingDataURL,
}: {
  letter: string;
  onSave: (paths: PathData[]) => void;
  existingDataURL?: PathData[] | null;
}) {
  const [paths, setPaths] = useState<PathData[]>(existingDataURL || []);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const hasDrawn = useRef(false);

  type Point = {x: number; y: number};
  type PathData = Point[];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        setCurrentPath([{x: locationX, y: locationY}]);
        hasDrawn.current = true;
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        setCurrentPath(prev => [...prev, {x: locationX, y: locationY}]);
      },
      onPanResponderRelease: () => {
        setPaths(prev => {
          const newPaths = [...prev, currentPath];
          return newPaths;
        });
        setCurrentPath([]);
      },
    }),
  ).current;

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    hasDrawn.current = false;
  };

  const handleSave = () => {
    if (paths.length === 0 && currentPath.length === 0) return;
    onSave(paths);
  };

  const pointsToSVGPath = (pts: Point[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const Svg = require('react-native-svg').Svg;
  const Path = require('react-native-svg').Path;
  const Line = require('react-native-svg').Line;

  return (
    <View style={styles.canvasWrapper}>
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        {/* Baseline */}
        <View style={styles.baseline} />
        {/* Hint text */}
        {paths.length === 0 && currentPath.length === 0 && (
          <Text style={styles.inkHint}>Write '{letter}' here…</Text>
        )}
        {/* SVG strokes */}
        <Svg
          width={CANVAS_WIDTH - 2}
          height={CANVAS_HEIGHT}
          style={StyleSheet.absoluteFill}>
          {/* Dashed baseline */}
          <Line
            x1="20"
            y1="210"
            x2={CANVAS_WIDTH - 52}
            y2="210"
            stroke="rgba(244,248,249,0.1)"
            strokeWidth="1"
            strokeDasharray="4,6"
          />
          {paths.map((pts, i) => (
            <Path
              key={i}
              d={pointsToSVGPath(pts)}
              stroke="#e8f5e0"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath.length > 1 && (
            <Path
              d={pointsToSVGPath(currentPath)}
              stroke="#e8f5e0"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>

      <View style={styles.canvasButtons}>
        <TouchableOpacity style={[styles.skeuButton, styles.clearBtn]} onPress={clearCanvas}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.skeuButton, styles.primaryBtn, styles.saveBtn]}
          onPress={handleSave}>
          <Text style={styles.primaryBtnText}>Save Character</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
type Screen = 'home' | 'letter' | 'draw';
type PathData = {x: number; y: number}[];
type CapturedMap = Record<string, PathData[]>;

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<'upper' | 'lower' | null>(null);
  const [captured, setCaptured] = useState<CapturedMap>({});
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const totalChars = 52;
  const capturedCount = Object.keys(captured).length;
  const progress = (capturedCount / totalChars) * 100;

  // Load from storage
  useEffect(() => {
    AsyncStorage.getItem('captured_chars').then(val => {
      if (val) setCaptured(JSON.parse(val));
    });
  }, []);

  // Save to storage when captured changes
  useEffect(() => {
    AsyncStorage.setItem('captured_chars', JSON.stringify(captured));
  }, [captured]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.delay(1800),
      Animated.timing(toastAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start(() => setToastVisible(false));
  };

  const openLetter = (l: string) => {
    setActiveLetter(l);
    setScreen('letter');
  };
  const openDraw = (c: 'upper' | 'lower') => {
    setActiveCase(c);
    setScreen('draw');
  };
  const goBack = () => {
    if (screen === 'draw') setScreen('letter');
    else if (screen === 'letter') setScreen('home');
  };

  const handleSave = (paths: PathData[]) => {
    const key = activeCase === 'upper' ? activeLetter! : activeLetter!.toLowerCase();
    setCaptured(prev => ({...prev, [key]: paths}));
    showToast(`'${key}' saved to your font!`);
    setTimeout(() => setScreen('letter'), 500);
  };

  const isCaptured = (letter: string) =>
    captured[letter] || captured[letter.toLowerCase()];

  const drawKey = activeCase === 'upper' ? activeLetter : activeLetter?.toLowerCase();
  const drawCaptured = drawKey ? captured[drawKey] : null;

  // SVG mini-preview for captured chars
  const Svg = require('react-native-svg').Svg;
  const SvgPath = require('react-native-svg').Path;

  const pointsToSVGPath = (pts: PathData[0]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    return d;
  };

  const MiniPreview = ({paths}: {paths: PathData[]}) => {
    // Scale strokes to 36x36
    const allPts = paths.flat();
    if (allPts.length === 0) return null;
    const xs = allPts.map(p => p.x);
    const ys = allPts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = 28 / Math.max(rangeX, rangeY);
    const offsetX = 4 - minX * scale + (28 - rangeX * scale) / 2;
    const offsetY = 4 - minY * scale + (28 - rangeY * scale) / 2;

    return (
      <View style={styles.miniPreviewBox}>
        <Svg width={36} height={36}>
          {paths.map((pts, i) => (
            <SvgPath
              key={i}
              d={pts
                .map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x * scale + offsetX} ${p.y * scale + offsetY}`)
                .join(' ')}
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── HOME SCREEN ── */}
      {screen === 'home' && (
        <View style={styles.screen}>
          <View style={styles.homeHeader}>
            <Text style={styles.subLabel}>Your Handwriting</Text>
            <Text style={styles.heroTitle}>Font Studio</Text>
          </View>

          {/* Progress Card */}
          <View style={[styles.skeuCard, styles.progressCard]}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Collection Progress</Text>
              <Text style={styles.progressCount}>
                {capturedCount}
                <Text style={styles.progressTotal}>/{totalChars}</Text>
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, {width: `${progress}%`}]} />
            </View>
          </View>

          {/* Alphabet Grid */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.alphaGrid}>
              {alphabet.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.skeuButton, styles.alphaBtn, isCaptured(l) ? styles.alphaCaptured : null]}
                  onPress={() => openLetter(l)}>
                  <Text style={[styles.alphaBtnText, isCaptured(l) ? styles.alphaCapturedText : null]}>
                    {l}
                  </Text>
                  {isCaptured(l) && <View style={styles.capturedDot} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.divider} />
            <View style={[styles.skeuCard, styles.previewCard]}>
              <Text style={[styles.subLabel, {textAlign: 'center', marginBottom: 12}]}>Preview</Text>
              <Text style={styles.previewText}>
                {capturedCount > 0 ? 'Your style, your words.' : 'Start writing…'}
              </Text>
              {capturedCount > 0 && (
                <View style={styles.previewThumbs}>
                  {Object.entries(captured)
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <MiniPreview key={k} paths={v} />
                    ))}
                  {capturedCount > 8 && (
                    <View style={styles.overflowBadge}>
                      <Text style={styles.overflowText}>+{capturedCount - 8}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={{height: 40}} />
          </ScrollView>
        </View>
      )}

      {/* ── LETTER CASE SCREEN ── */}
      {screen === 'letter' && activeLetter && (
        <View style={styles.screen}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={[styles.skeuButton, styles.backBtn]} onPress={goBack}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.subLabel}>Choose Case</Text>
              <Text style={styles.screenTitle}>{activeLetter}</Text>
            </View>
          </View>

          <View style={styles.caseRow}>
            <TouchableOpacity
              style={[styles.skeuButton, styles.caseOption, captured[activeLetter] ? styles.caseOptionCaptured : null]}
              onPress={() => openDraw('upper')}>
              <Text style={styles.caseLetter}>{activeLetter}</Text>
              <Text style={styles.caseTag}>Uppercase</Text>
              {captured[activeLetter] && (
                <View style={styles.savedBadge}>
                  <MiniPreview paths={captured[activeLetter]} />
                  <Text style={styles.savedText}>Saved ✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.skeuButton, styles.caseOption, captured[activeLetter.toLowerCase()] ? styles.caseOptionCaptured : null]}
              onPress={() => openDraw('lower')}>
              <Text style={[styles.caseLetter, {fontStyle: 'italic'}]}>
                {activeLetter.toLowerCase()}
              </Text>
              <Text style={styles.caseTag}>Lowercase</Text>
              {captured[activeLetter.toLowerCase()] && (
                <View style={styles.savedBadge}>
                  <MiniPreview paths={captured[activeLetter.toLowerCase()]} />
                  <Text style={styles.savedText}>Saved ✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          <Text style={styles.caseHint}>Tap to draw your handwritten character</Text>
        </View>
      )}

      {/* ── DRAW SCREEN ── */}
      {screen === 'draw' && activeLetter && activeCase && (
        <View style={styles.screen}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={[styles.skeuButton, styles.backBtn]} onPress={goBack}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.subLabel}>
                {activeCase === 'upper' ? 'Uppercase' : 'Lowercase'}
              </Text>
              <Text style={styles.screenTitle}>
                Write '{activeCase === 'upper' ? activeLetter : activeLetter.toLowerCase()}'
              </Text>
            </View>
          </View>

          {drawCaptured && (
            <View style={styles.redrawBanner}>
              <MiniPreview paths={drawCaptured} />
              <Text style={styles.redrawText}>Previously saved — redraw to update</Text>
            </View>
          )}

          <DrawingCanvas
            key={`${activeLetter}-${activeCase}`}
            letter={activeCase === 'upper' ? activeLetter : activeLetter.toLowerCase()}
            onSave={handleSave}
            existingDataURL={drawCaptured}
          />

          <View style={styles.drawTip}>
            <Text style={styles.drawTipText}>
              Write naturally on the canvas above. Use the dashed baseline as a guide.
              Your strokes will be stored in your personal font set.
            </Text>
          </View>
        </View>
      )}

      {/* ── TOAST ── */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  screen: {
    flex: 1,
  },

  // Header
  homeHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  subLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 13,
    color: 'rgba(244,248,249,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 34,
    fontWeight: '700',
    color: LIGHT,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  screenTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26,
    fontWeight: '700',
    color: LIGHT,
    letterSpacing: -0.5,
  },
  backBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  backArrow: {
    color: LIGHT,
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },

  // Cards
  skeuCard: {
    backgroundColor: '#243f38',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,248,249,0.05)',
    shadowColor: SHADOW_DARK,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    color: 'rgba(244,248,249,0.55)',
    letterSpacing: 0.5,
  },
  progressCount: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    color: ACCENT,
    fontWeight: '700',
  },
  progressTotal: {
    color: 'rgba(244,248,249,0.3)',
    fontSize: 14,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#0d1f1b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: ACCENT,
    borderRadius: 3,
  },

  // Scroll & grid
  scrollContent: {
    flex: 1,
  },
  alphaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 10,
  },
  skeuButton: {
    backgroundColor: '#2a4a3f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244,248,249,0.07)',
    shadowColor: SHADOW_DARK,
    shadowOffset: {width: 3, height: 3},
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  alphaBtn: {
    width: (SCREEN_WIDTH - 24 - 40) / 5,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphaBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: LIGHT,
  },
  alphaCaptured: {
    borderColor: 'rgba(200,230,192,0.2)',
  },
  alphaCapturedText: {
    color: ACCENT,
  },
  capturedDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },

  // Divider
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: 'rgba(244,248,249,0.08)',
  },

  // Preview
  previewCard: {
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 8,
  },
  previewText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontStyle: 'italic',
    color: 'rgba(244,248,249,0.65)',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  previewThumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  miniPreviewBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(244,248,249,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 11,
    color: 'rgba(244,248,249,0.4)',
  },

  // Case screen
  caseRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  caseOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 20,
  },
  caseOptionCaptured: {
    borderColor: 'rgba(200,230,192,0.2)',
  },
  caseLetter: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 64,
    fontWeight: '400',
    color: LIGHT,
    lineHeight: 70,
  },
  caseTag: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(244,248,249,0.4)',
    marginTop: 4,
  },
  savedBadge: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    fontSize: 11,
    color: ACCENT,
    letterSpacing: 0.8,
  },
  caseHint: {
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 14,
    color: 'rgba(244,248,249,0.3)',
    letterSpacing: 0.5,
    paddingBottom: 32,
  },

  // Canvas
  canvasWrapper: {
    paddingHorizontal: 16,
  },
  canvasContainer: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#172b25',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,248,249,0.06)',
  },
  baseline: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 210,
    height: 1,
    backgroundColor: 'rgba(244,248,249,0.06)',
  },
  inkHint: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 14,
    color: 'rgba(244,248,249,0.2)',
  },
  canvasButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  clearBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    color: 'rgba(244,248,249,0.6)',
    letterSpacing: 0.5,
  },
  primaryBtn: {
    backgroundColor: '#2d5e45',
    borderColor: 'rgba(200,230,192,0.15)',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  primaryBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT,
    letterSpacing: 0.5,
  },

  // Draw screen extras
  redrawBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(76,175,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200,230,192,0.15)',
  },
  redrawText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    color: ACCENT,
  },
  drawTip: {
    margin: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(244,248,249,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(244,248,249,0.06)',
  },
  drawTipText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 13,
    color: 'rgba(244,248,249,0.4)',
    lineHeight: 20,
    letterSpacing: 0.3,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2a4a3f',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(200,230,192,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  toastText: {
    color: ACCENT,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
