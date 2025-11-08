/**
 * LINE API処理モジュール（LINE公式SDK使用）
 *
 * 機能:
 * - Webhook署名検証
 * - メッセージハンドリング
 * - Reply APIでの返信
 */

import {
  Client,
  WebhookEvent,
  MessageEvent,
  TextMessage,
  ImageMessage,
  validateSignature as lineValidateSignature,
  Message,
  ImageEventMessage,
  TextEventMessage,
  FlexMessage,
  FlexBubble,
} from "npm:@line/bot-sdk@9.3.0";

import {
  LINE_COLORS,
  FLEX_MESSAGE,
  LINE_STICKERS,
  MESSAGE_TEMPLATES,
  DURATIONS,
} from "./constants.ts";

// LINE Client の初期化
export function createLineClient(channelAccessToken: string): Client {
  return new Client({
    channelAccessToken,
  });
}

/**
 * LINE Webhook署名を検証
 *
 * @param body - リクエストボディ（文字列）
 * @param signature - X-Line-Signatureヘッダーの値
 * @param channelSecret - LINEチャネルシークレット
 * @returns 検証結果
 */
export function validateSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  return lineValidateSignature(body, channelSecret, signature);
}

/**
 * テキストメッセージイベントを検出
 *
 * @param events - Webhookイベント配列
 * @returns テキストメッセージイベント（存在しない場合はnull）
 */
export function findTextMessageEvent(
  events: WebhookEvent[]
): MessageEvent | null {
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      return event as MessageEvent;
    }
  }
  return null;
}

/**
 * 画像メッセージイベントを検出
 *
 * @param events - Webhookイベント配列
 * @returns 画像メッセージイベント（存在しない場合はnull）
 */
export function findImageMessageEvent(
  events: WebhookEvent[]
): MessageEvent | null {
  for (const event of events) {
    if (event.type === "message" && event.message.type === "image") {
      return event as MessageEvent;
    }
  }
  return null;
}

/**
 * LINE APIから画像コンテンツをダウンロード
 *
 * @param messageId - メッセージID
 * @param accessToken - LINEアクセストークン
 * @returns 画像データ（base64エンコード済み）とMIMEタイプ
 */
export async function downloadImageContent(
  messageId: string,
  accessToken: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    console.log(`📥 画像コンテンツをダウンロード中... (messageId: ${messageId})`);

    // 直接fetch APIで画像を取得（Deno環境用）
    const response = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ 画像ダウンロード失敗: ${response.status} ${response.statusText}`);
      return null;
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Base64エンコード（チャンク処理でスタックオーバーフロー回避）
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);

    console.log(`✅ 画像ダウンロード完了 (サイズ: ${uint8Array.length} bytes, MIME: ${mimeType})`);

    return {
      data: base64,
      mimeType,
    };
  } catch (error) {
    console.error("❌ 画像ダウンロードエラー:", error);
    return null;
  }
}

/**
 * テキストメッセージをオウム返し
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 * @param text - 受信したテキスト
 */
export async function echoTextMessage(
  client: Client,
  replyToken: string,
  text: string
): Promise<boolean> {
  try {
    console.log(`🔄 テキストメッセージをオウム返し: "${text}"`);

    const message: TextMessage = {
      type: "text",
      text: `オウム返し: ${text}`,
    };

    await client.replyMessage(replyToken, message);
    console.log("✅ オウム返し送信成功");
    return true;
  } catch (error) {
    console.error("❌ オウム返し送信エラー:", error);
    return false;
  }
}

/**
 * LINE Loading Animationを表示
 *
 * @param userId - ユーザーID
 * @param accessToken - LINEアクセストークン
 * @param seconds - ローディング表示時間（5-60秒）
 */
export async function showLoadingAnimation(
  userId: string,
  accessToken: string,
  seconds: number = DURATIONS.LOADING_ANIMATION_SECONDS
): Promise<void> {
  try {
    console.log(`⏳ Loading Animation表示開始 (${seconds}秒)`);

    const response = await fetch(
      "https://api.line.me/v2/bot/chat/loading/start",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatId: userId,
          loadingSeconds: Math.min(Math.max(seconds, DURATIONS.LOADING_ANIMATION_MIN), DURATIONS.LOADING_ANIMATION_MAX),
        }),
      }
    );

    if (!response.ok) {
      console.error(`⚠️ Loading Animation失敗: ${response.status} ${response.statusText}`);
    } else {
      console.log("✅ Loading Animation表示成功");
    }
  } catch (error) {
    console.error("⚠️ Loading Animation表示エラー:", error);
  }
}

/**
 * 処理中メッセージを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 */
export async function sendProcessingMessage(
  client: Client,
  replyToken: string
): Promise<void> {
  const message: TextMessage = {
    type: "text",
    text: "📸 画像を処理中です...\n人・ポーズを分析しています！",
  };

  await client.replyMessage(replyToken, message);
}

/**
 * 画像編集中メッセージを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 */
export async function sendEditingMessage(
  client: Client,
  replyToken: string
): Promise<boolean> {
  try {
    const message: TextMessage = {
      type: "text",
      text: MESSAGE_TEMPLATES.EDITING,
    };

    await client.replyMessage(replyToken, [
      {
        type: "sticker",
        packageId: LINE_STICKERS.EDITING.packageId,
        stickerId: LINE_STICKERS.EDITING.stickerId,
      },
      message
    ]);
    console.log("✅ 編集中メッセージ送信成功");
    return true;
  } catch (error) {
    console.error("❌ 編集中メッセージ送信エラー:", error);
    return false;
  }
}

/**
 * アメコミ風変換画像をPush APIで送信
 *
 * @param client - LINE Client
 * @param userId - ユーザーID
 * @param comicUrl - アメコミ風画像URL
 */
export async function pushComicImage(
  client: Client,
  userId: string,
  comicUrl: string
): Promise<boolean> {
  try {
    const messages: Message[] = [
      {
        type: "image",
        originalContentUrl: comicUrl,
        previewImageUrl: comicUrl,
      } as ImageMessage,
      {
        type: "text",
        text: MESSAGE_TEMPLATES.COMIC_COMPLETE,
      } as TextMessage,
    ];

    await client.pushMessage(userId, messages);
    console.log("✅ アメコミ風変換画像送信成功");
    return true;
  } catch (error) {
    console.error("❌ アメコミ風変換画像送信エラー:", error);
    return false;
  }
}

/**
 * 条件不一致メッセージを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 * @param faceDetected - 顔検出結果
 * @param isPose - ポーズ検出結果
 */
export async function sendConditionNotMetMessage(
  client: Client,
  replyToken: string,
  faceDetected: string,
  isPose: string
): Promise<boolean> {
  try {
    let message = "📸 画像を分析しました！\n\n";

    if (faceDetected === "No") {
      message += "❌ 人の顔が検出されませんでした\n";
    } else {
      message += "✅ 人の顔を検出しました\n";
    }

    if (isPose === "No") {
      message += "❌ ポーズが検出されませんでした\n";
    } else {
      message += "✅ ポーズを検出しました\n";
    }

    message += "\n🦸 アメコミ風変換は、人がいてポーズをしている場合のみ実行されます。\n";
    message += "💡 カメラに向かってピースサイン、グッドサイン、ガッツポーズなどをしてみてください！";

    const textMessage: TextMessage = {
      type: "text",
      text: message,
    };

    await client.replyMessage(replyToken, textMessage);
    console.log("✅ 条件不一致メッセージ送信成功");
    return true;
  } catch (error) {
    console.error("❌ 条件不一致メッセージ送信エラー:", error);
    return false;
  }
}

/**
 * エラーメッセージを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 * @param errorType - エラータイプ（オプション）
 */
export async function sendErrorMessage(
  client: Client,
  replyToken: string,
  errorType?: string
): Promise<void> {
  try {
    let message = "❌ 画像処理中にエラーが発生しました。\n";

    if (errorType === "rate_limit") {
      message = "⏰ 現在、AI処理のリクエストが集中しています。\n" +
                "少し時間をおいてから（1-2分後）もう一度お試しください。\n\n" +
                "💡 Gemini APIのレート制限に達しています。";
    } else {
      message += "もう一度お試しください。";
    }

    const textMessage: TextMessage = {
      type: "text",
      text: message,
    };

    await client.replyMessage(replyToken, textMessage);
    console.log("⚠️ エラーメッセージ送信完了");
  } catch (error) {
    console.error("❌ エラーメッセージ送信も失敗:", error);
  }
}

/**
 * 画像とLIFFリンクを含むFlex Messageを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 * @param imageUrl - 画像のURL
 * @param hashId - 画像のハッシュID
 * @param liffUrl - LIFF アプリのURL
 */
export async function sendImageFlexMessage(
  client: Client,
  replyToken: string,
  imageUrl: string,
  hashId: string,
  liffUrl: string
): Promise<boolean> {
  try {
    console.log(`📤 Flex Message送信中...`);
    console.log(`   画像URL: ${imageUrl}`);
    console.log(`   LIFF URL: ${liffUrl}`);

    const flexMessage: FlexMessage = {
      type: "flex",
      altText: FLEX_MESSAGE.ALT_TEXT_TEMPLATE(MESSAGE_TEMPLATES.BRAND_NAME),
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: imageUrl,
          size: FLEX_MESSAGE.IMAGE_SIZE,
          aspectRatio: FLEX_MESSAGE.ASPECT_RATIO,
          aspectMode: FLEX_MESSAGE.ASPECT_MODE,
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: FLEX_MESSAGE.HERO_TITLE,
              weight: "bold",
              size: FLEX_MESSAGE.TITLE_SIZE,
              color: LINE_COLORS.GREEN_600,
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "text",
              text: MESSAGE_TEMPLATES.SLIDESHOW_DESCRIPTION,
              size: FLEX_MESSAGE.TEXT_SIZE_SM,
              color: LINE_COLORS.GRAY_400,
              margin: "md",
              wrap: true,
            },
          ],
          backgroundColor: LINE_COLORS.DARK_BG,
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              action: {
                type: "uri",
                label: FLEX_MESSAGE.BUTTON_PRIMARY_LABEL,
                uri: liffUrl,
              },
              color: LINE_COLORS.GREEN_600,
            },
          ],
          backgroundColor: LINE_COLORS.DARK_BG,
        },
        styles: {
          body: {
            backgroundColor: LINE_COLORS.DARK_BG,
          },
          footer: {
            backgroundColor: LINE_COLORS.DARK_BG,
          },
        },
      },
    };

    await client.replyMessage(replyToken, flexMessage);
    console.log("✅ Flex Message送信成功");
    return true;
  } catch (error) {
    console.error("❌ Flex Message送信エラー:", error);
    return false;
  }
}
