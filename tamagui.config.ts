import { createTamagui, createTokens, createFont } from '@tamagui/core'
import { createAnimations } from '@tamagui/animations-react-native'
import { unifiedTheme } from './theme/unifiedTheme'

// Create font configurations
const interFont = createFont({
  family: 'Inter',
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 22,
    8: 24,
    9: 28,
    10: 32,
    11: 36,
    12: 48,
    13: 60,
    14: 72,
    15: 96,
    16: 128,
  },
  lineHeight: {
    1: 12,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 28,
    9: 32,
    10: 36,
    11: 40,
    12: 52,
    13: 64,
    14: 76,
    15: 100,
    16: 132,
  },
  weight: {
    1: '100',
    2: '200',
    3: '300',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    8: '800',
    9: '900',
  },
  letterSpacing: {
    1: -0.5,
    2: -0.25,
    3: 0,
    4: 0.25,
    5: 0.5,
    6: 0.75,
    7: 1,
    8: 1.25,
    9: 1.5,
  },
  transform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    none: 'none',
  },
})

// Create design tokens from unified theme
const tokens = createTokens({
  color: {
    // Primary colors
    primary50: unifiedTheme.tokens.colors.primary[50],
    primary100: unifiedTheme.tokens.colors.primary[100],
    primary200: unifiedTheme.tokens.colors.primary[200],
    primary300: unifiedTheme.tokens.colors.primary[300],
    primary400: unifiedTheme.tokens.colors.primary[400],
    primary500: unifiedTheme.tokens.colors.primary[500],
    primary600: unifiedTheme.tokens.colors.primary[600],
    primary700: unifiedTheme.tokens.colors.primary[700],
    primary800: unifiedTheme.tokens.colors.primary[800],
    primary900: unifiedTheme.tokens.colors.primary[900],
    primary950: unifiedTheme.tokens.colors.primary[950],

    // Gray colors
    gray50: unifiedTheme.tokens.colors.gray[50],
    gray100: unifiedTheme.tokens.colors.gray[100],
    gray200: unifiedTheme.tokens.colors.gray[200],
    gray300: unifiedTheme.tokens.colors.gray[300],
    gray400: unifiedTheme.tokens.colors.gray[400],
    gray500: unifiedTheme.tokens.colors.gray[500],
    gray600: unifiedTheme.tokens.colors.gray[600],
    gray700: unifiedTheme.tokens.colors.gray[700],
    gray800: unifiedTheme.tokens.colors.gray[800],
    gray900: unifiedTheme.tokens.colors.gray[900],
    gray950: unifiedTheme.tokens.colors.gray[950],

    // Semantic colors
    success500: unifiedTheme.tokens.colors.success[500],
    error500: unifiedTheme.tokens.colors.error[500],
    warning500: unifiedTheme.tokens.colors.warning[500],
    info500: unifiedTheme.tokens.colors.info[500],

    // Platform colors
    twitch: unifiedTheme.tokens.colors.platform.twitch,
    youtube: unifiedTheme.tokens.colors.platform.youtube,
    discord: unifiedTheme.tokens.colors.platform.discord,

    // Live streaming colors
    live: unifiedTheme.tokens.colors.live.active,
    offline: unifiedTheme.tokens.colors.live.inactive,

    // Special colors
    transparent: 'transparent',
    white: '#ffffff',
    black: '#000000',
  },
  
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },
  
  size: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
    full: '100%',
  },
  
  radius: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 12,
    6: 16,
    7: 20,
    8: 24,
    9: 28,
    10: 32,
    11: 36,
    12: 40,
    round: 1000,
  },
  
  zIndex: {
    0: 0,
    1: 10,
    2: 100,
    3: 1000,
    4: 10000,
    5: 100000,
  },
})

// Create animations
const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 150,
  },
  medium: {
    type: 'timing',
    duration: 300,
  },
  slow: {
    type: 'timing',
    duration: 500,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
})

// Create theme configurations
const lightThemeConfig = {
  background: tokens.color.gray50,
  backgroundHover: tokens.color.gray100,
  backgroundPress: tokens.color.gray200,
  backgroundFocus: tokens.color.gray100,
  backgroundStrong: tokens.color.gray900,
  backgroundTransparent: tokens.color.transparent,
  color: tokens.color.gray900,
  colorHover: tokens.color.gray800,
  colorPress: tokens.color.gray700,
  colorFocus: tokens.color.gray800,
  colorTransparent: tokens.color.transparent,
  borderColor: tokens.color.gray300,
  borderColorHover: tokens.color.gray400,
  borderColorFocus: tokens.color.primary500,
  borderColorPress: tokens.color.gray400,
  placeholderColor: tokens.color.gray500,
  primary: tokens.color.primary500,
  primaryHover: tokens.color.primary600,
  primaryPress: tokens.color.primary700,
  primaryFocus: tokens.color.primary500,
  secondary: tokens.color.gray200,
  secondaryHover: tokens.color.gray300,
  secondaryPress: tokens.color.gray400,
  secondaryFocus: tokens.color.gray200,
  success: tokens.color.success500,
  error: tokens.color.error500,
  warning: tokens.color.warning500,
  info: tokens.color.info500,
}

const darkThemeConfig = {
  background: tokens.color.gray950,
  backgroundHover: tokens.color.gray900,
  backgroundPress: tokens.color.gray800,
  backgroundFocus: tokens.color.gray900,
  backgroundStrong: tokens.color.gray50,
  backgroundTransparent: tokens.color.transparent,
  color: tokens.color.gray50,
  colorHover: tokens.color.gray100,
  colorPress: tokens.color.gray200,
  colorFocus: tokens.color.gray100,
  colorTransparent: tokens.color.transparent,
  borderColor: tokens.color.gray700,
  borderColorHover: tokens.color.gray600,
  borderColorFocus: tokens.color.primary500,
  borderColorPress: tokens.color.gray600,
  placeholderColor: tokens.color.gray500,
  primary: tokens.color.primary500,
  primaryHover: tokens.color.primary400,
  primaryPress: tokens.color.primary300,
  primaryFocus: tokens.color.primary500,
  secondary: tokens.color.gray800,
  secondaryHover: tokens.color.gray700,
  secondaryPress: tokens.color.gray600,
  secondaryFocus: tokens.color.gray800,
  success: tokens.color.success500,
  error: tokens.color.error500,
  warning: tokens.color.warning500,
  info: tokens.color.info500,
}

// Create the Tamagui configuration
const config = createTamagui({
  fonts: {
    heading: interFont,
    body: interFont,
    mono: interFont,
  },
  tokens,
  themes: {
    light: lightThemeConfig,
    dark: darkThemeConfig,
    // Theme variants
    light_primary: {
      ...lightThemeConfig,
      background: tokens.color.primary500,
      color: tokens.color.white,
    },
    dark_primary: {
      ...darkThemeConfig,
      background: tokens.color.primary500,
      color: tokens.color.white,
    },
    light_success: {
      ...lightThemeConfig,
      background: tokens.color.success500,
      color: tokens.color.white,
    },
    dark_success: {
      ...darkThemeConfig,
      background: tokens.color.success500,
      color: tokens.color.white,
    },
    light_error: {
      ...lightThemeConfig,
      background: tokens.color.error500,
      color: tokens.color.white,
    },
    dark_error: {
      ...darkThemeConfig,
      background: tokens.color.error500,
      color: tokens.color.white,
    },
  },
  animations,
  shorthands: {
    // Layout
    p: 'padding',
    pt: 'paddingTop',
    pr: 'paddingRight',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mt: 'marginTop',
    mr: 'marginRight',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    
    // Dimensions
    w: 'width',
    h: 'height',
    minW: 'minWidth',
    minH: 'minHeight',
    maxW: 'maxWidth',
    maxH: 'maxHeight',
    
    // Flexbox
    fd: 'flexDirection',
    fw: 'flexWrap',
    ai: 'alignItems',
    ac: 'alignContent',
    jc: 'justifyContent',
    as: 'alignSelf',
    fg: 'flexGrow',
    fs: 'flexShrink',
    fb: 'flexBasis',
    
    // Position
    pos: 'position',
    t: 'top',
    r: 'right',
    b: 'bottom',
    l: 'left',
    zi: 'zIndex',
    
    // Border
    bc: 'borderColor',
    br: 'borderRadius',
    bw: 'borderWidth',
    btw: 'borderTopWidth',
    brw: 'borderRightWidth',
    bbw: 'borderBottomWidth',
    blw: 'borderLeftWidth',
    
    // Colors
    bg: 'backgroundColor',
    col: 'color',
    
    // Typography
    ff: 'fontFamily',
    fos: 'fontSize',
    fow: 'fontWeight',
    lh: 'lineHeight',
    ls: 'letterSpacing',
    ta: 'textAlign',
    td: 'textDecorationLine',
    tt: 'textTransform',
    
    // Shadow
    shc: 'shadowColor',
    sho: 'shadowOffset',
    shop: 'shadowOpacity',
    shr: 'shadowRadius',
  },
  media: {
    xs: { maxWidth: 479 },
    sm: { maxWidth: 767 },
    md: { maxWidth: 991 },
    lg: { maxWidth: 1279 },
    xl: { maxWidth: 1535 },
    xxl: { minWidth: 1536 },
    gtXs: { minWidth: 480 },
    gtSm: { minWidth: 768 },
    gtMd: { minWidth: 992 },
    gtLg: { minWidth: 1280 },
    short: { maxHeight: 820 },
    tall: { minHeight: 821 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export default config

export type Conf = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

// Export theme tokens for use in other parts of the app
export { tokens, lightThemeConfig, darkThemeConfig }