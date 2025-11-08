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
} from "npm:@line/bot-sdk@9.3.0";

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
 * @param client - LINE Client
 * @param messageId - メッセージID
 * @returns 画像データ（base64エンコード済み）とMIMEタイプ
 */
export async function downloadImageContent(
  client: Client,
  messageId: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    console.log(`📥 画像コンテンツをダウンロード中... (messageId: ${messageId})`);

    const stream = await client.getMessageContent(messageId);
    const chunks: Uint8Array[] = [];

    // ReadableStreamからデータを読み取る
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    // Uint8Array を結合
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const uint8Array = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      uint8Array.set(chunk, offset);
      offset += chunk.length;
    }

    // Base64エンコード
    const base64 = btoa(String.fromCharCode(...uint8Array));

    // MIMEタイプは画像として扱う（LINEは通常JPEG）
    const mimeType = "image/jpeg";

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
 * アメコミ風変換成功メッセージを送信
 *
 * @param client - LINE Client
 * @param replyToken - リプライトークン
 * @param originalUrl - オリジナル画像URL
 * @param comicUrl - アメコミ風画像URL
 */
export async function sendComicConversionResult(
  client: Client,
  replyToken: string,
  originalUrl: string,
  comicUrl: string
): Promise<boolean> {
  try {
    const messages: Message[] = [
      {
        type: "image",
        originalContentUrl: comicUrl,
        previewImageUrl: originalUrl,
      } as ImageMessage,
      {
        type: "text",
        text: "🦸 アメコミ風変換完了！\n✅ 人がいてポーズをしているのを検出しました！",
      } as TextMessage,
    ];

    await client.replyMessage(replyToken, messages);
    console.log("✅ アメコミ風変換結果送信成功");
    return true;
  } catch (error) {
    console.error("❌ アメコミ風変換結果送信エラー:", error);
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
 */
export async function sendErrorMessage(
  client: Client,
  replyToken: string
): Promise<void> {
  try {
    const message: TextMessage = {
      type: "text",
      text: "❌ 画像処理中にエラーが発生しました。\nもう一度お試しください。",
    };

    await client.replyMessage(replyToken, message);
    console.log("⚠️ エラーメッセージ送信完了");
  } catch (error) {
    console.error("❌ エラーメッセージ送信も失敗:", error);
  }
}
