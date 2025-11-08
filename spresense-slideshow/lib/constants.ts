/**
 * Application-wide constants
 * Centralizes magic values, colors, and endpoints for maintainability
 */

// LINE Brand Colors
export const LINE_COLORS = {
  GREEN_600: '#06C755',
  GREEN_500: '#05b34c',
  DARK_BG: '#16213e',
  GRAY_900: '#1a1a1a',
  GRAY_700: '#4a4a4a',
  GRAY_600: '#666666',
  GRAY_400: '#aaaaaa',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  LINE_SHARE: 'https://line.me/R/share',
  LINE_OA_MESSAGE: 'https://line.me/R/oaMessage',
  LIFF_BASE: 'https://liff.line.me',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  QR_CODE_SIZE_LARGE: 256,
  QR_CODE_SIZE_SMALL: 150,
  QR_CODE_ERROR_CORRECTION_LEVEL: 'H',
  DESKTOP_BREAKPOINT: 768,
} as const;

// Flex Message Constants
export const FLEX_MESSAGE = {
  ASPECT_RATIO: '4:3',
  ASPECT_MODE: 'cover',
  IMAGE_SIZE: 'full',
  HERO_TITLE: '📸 ヒーロー、見参！',
  TITLE_SIZE: 'xl',
  TEXT_SIZE_SM: 'sm',
  BUTTON_PRIMARY_LABEL: '🎬 スライドショーで見る',
  BUTTON_SHARE_LABEL: '他の人に共有する',
  ALT_TEXT: 'Boom!ヒーロー!!',
} as const;

// Sticker IDs for LINE messages
export const LINE_STICKERS = {
  EDITING: {
    packageId: '11537',
    stickerId: '52002746',
  },
} as const;

// Message Templates
export const MESSAGE_TEMPLATES = {
  QR_SCAN_INSTRUCTION: 'スマホで開く',
  BRAND_NAME: 'Boom!ヒーロー!!',
  SAFETY_NOTICE: '※Boom!ヒーロー!!公式アプリで安全に表示されます',
  SHARE_CALL_TO_ACTION: '☝️ タップして開く ☝️',
} as const;

// Timeout and Animation Durations
export const DURATIONS = {
  LOADING_ANIMATION_SECONDS: 60,
  LOADING_ANIMATION_MIN: 5,
  LOADING_ANIMATION_MAX: 60,
} as const;
