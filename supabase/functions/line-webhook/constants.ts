/**
 * Application-wide constants for LINE Webhook Edge Function
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

// Flex Message Constants
export const FLEX_MESSAGE = {
  ASPECT_RATIO: '4:3',
  ASPECT_MODE: 'cover',
  IMAGE_SIZE: 'full',
  HERO_TITLE: '📸 ヒーロー、見参！',
  TITLE_SIZE: 'xl',
  TEXT_SIZE_SM: 'sm',
  BUTTON_PRIMARY_LABEL: '🎬 スライドショーで見る',
  ALT_TEXT_TEMPLATE: (brandName: string) => `📸 画像をスライドショーで見る - ${brandName}`,
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
  BRAND_NAME: 'Boom!ヒーロー!!',
  EDITING: '🎨 画像を編集中です...\nしばらくお待ちください',
  COMIC_COMPLETE: '🦸 アメコミ風変換完了！',
  ERROR_GENERIC: '❌ 画像処理中にエラーが発生しました。\nもう一度お試しください。',
  ERROR_RATE_LIMIT: '⏰ 現在、AI処理のリクエストが集中しています。\n少し時間をおいてから（1-2分後）もう一度お試しください。',
  ERROR_CONVERSION_FAILED: '❌ 画像変換に失敗しました。もう一度お試しください。',
  ERROR_UPLOAD_FAILED: '❌ 画像のアップロードに失敗しました。もう一度お試しください。',
  ERROR_PROCESSING_FAILED: '❌ 処理中にエラーが発生しました。もう一度お試しください。',
  IMAGE_NOT_FOUND: (hashId: string) => `申し訳ありません。画像が見つかりませんでした。\n(ID: ${hashId})`,
  SLIDESHOW_DESCRIPTION: 'スライドショーで大きく表示できます',
} as const;

// Timeout and Animation Durations
export const DURATIONS = {
  LOADING_ANIMATION_SECONDS: 60,
  LOADING_ANIMATION_MIN: 5,
  LOADING_ANIMATION_MAX: 60,
} as const;
