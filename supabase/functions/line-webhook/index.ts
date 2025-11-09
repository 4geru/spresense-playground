/**
 * LINE Webhook Edge Function
 *
 * LINEから送信されたメッセージを受け取り、以下の処理を実行:
 * - テキストメッセージ: オウム返し
 * - 画像メッセージ: Gemini分析 → アメコミ風変換 → Reply API返信
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { WebhookRequestBody } from "npm:@line/bot-sdk@9.3.0";

// モジュールのインポート
import {
  createLineClient,
  validateSignature,
  findTextMessageEvent,
  findImageMessageEvent,
  findFollowEvent,
  downloadImageContent,
  sendEditingMessage,
  pushComicImage,
  sendErrorMessage,
  showLoadingAnimation,
  sendImageFlexMessage,
  sendWelcomeMessage,
} from "./line.ts";

import {
  convertToComicStyle,
} from "./gemini.ts";

import { uploadImage, findImageByHashId, generateHashId } from "./storage.ts";

import { MESSAGE_TEMPLATES, DURATIONS } from "./constants.ts";

// 環境変数の型定義
interface EnvVars {
  GEMINI_API_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BUCKET_NAME: string;
  LIFF_ID: string;
}

/**
 * 環境変数を取得・検証
 */
function getEnvVars(): EnvVars | null {
  const requiredVars = [
    "GEMINI_API_KEY",
    "LINE_CHANNEL_SECRET",
    "LINE_CHANNEL_ACCESS_TOKEN",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BUCKET_NAME",
    "LIFF_ID",
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!Deno.env.get(varName)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error("❌ 環境変数設定エラー:");
    missingVars.forEach((v) => console.error(`   - ${v}`));
    return null;
  }

  return {
    GEMINI_API_KEY: Deno.env.get("GEMINI_API_KEY")!,
    LINE_CHANNEL_SECRET: Deno.env.get("LINE_CHANNEL_SECRET")!,
    LINE_CHANNEL_ACCESS_TOKEN: Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!,
    SUPABASE_URL: Deno.env.get("SUPABASE_URL")!,
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    BUCKET_NAME: Deno.env.get("BUCKET_NAME")!,
    LIFF_ID: Deno.env.get("LIFF_ID")!,
  };
}

/**
 * 友だち追加イベント処理
 */
async function processFollowEvent(
  event: any,
  env: EnvVars
): Promise<void> {
  const { replyToken } = event;

  if (!replyToken) {
    console.error("❌ replyTokenが不足");
    return;
  }

  try {
    console.log("👋 友だち追加イベント受信");

    const lineClient = createLineClient(env.LINE_CHANNEL_ACCESS_TOKEN);

    // ウェルカムメッセージを送信
    await sendWelcomeMessage(lineClient, replyToken);
  } catch (error) {
    console.error("❌ 友だち追加イベント処理エラー:", error);
  }
}

/**
 * テキストメッセージ処理
 */
async function processTextMessage(
  event: any,
  env: EnvVars
): Promise<void> {
  const { replyToken, message } = event;
  const text = message?.text;

  if (!replyToken || !text) {
    console.error("❌ replyTokenまたはtextが不足");
    return;
  }

  try {
    console.log("💬 テキストメッセージ受信");
    console.log(`   内容: "${text}"`);

    const lineClient = createLineClient(env.LINE_CHANNEL_ACCESS_TOKEN);

    // Codename:{hashId} パターンをチェック
    if (text.startsWith('Codename:')) {
      console.log("🔍 QRコード経由の画像表示リクエストを検出");

      const hashId = text.split(':', 2)[1].trim();
      console.log(`   hashId: ${hashId}`);

      // Supabaseクライアントを初期化
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      // hashIdから画像を検索
      const imageInfo = await findImageByHashId(supabase, env.BUCKET_NAME, hashId);

      if (imageInfo) {
        // LIFF URLを生成（Endpoint URLが /slides なので、パスは /{hashId} のみ）
        const liffUrl = `https://liff.line.me/${env.LIFF_ID}/${hashId}`;

        console.log(`✅ 画像が見つかりました: ${imageInfo.name}`);
        console.log(`🔗 LIFF URL: ${liffUrl}`);

        // Flex Messageで画像とLIFFリンクを返信
        await sendImageFlexMessage(
          lineClient,
          replyToken,
          imageInfo.url,
          hashId,
          liffUrl
        );
      } else {
        // 画像が見つからない場合
        console.log(`❌ 画像が見つかりませんでした (hashId: ${hashId})`);

        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: MESSAGE_TEMPLATES.IMAGE_NOT_FOUND(hashId),
        });
      }
    } else {
      // その他のテキストメッセージは無視
      console.log("ℹ️ サポート対象外のテキストメッセージ（無視）");
    }
  } catch (error) {
    console.error("❌ テキストメッセージ処理エラー:", error);
  }
}

/**
 * 画像メッセージ処理
 */
async function processImageMessage(
  event: any,
  env: EnvVars
): Promise<void> {
  const { replyToken, message, source } = event;
  const messageId = message?.id;
  const userId = source?.userId;

  // メッセージタイプが画像であることを明示的に確認
  if (message?.type !== "image") {
    console.log("ℹ️ 画像メッセージではありません（スキップ）");
    return;
  }

  if (!replyToken || !messageId) {
    console.error("❌ replyTokenまたはmessageIdが不足");
    return;
  }

  try {
    const lineClient = createLineClient(env.LINE_CHANNEL_ACCESS_TOKEN);

    // [1] 画像ダウンロード
    console.log("=".repeat(60));
    console.log("📥 画像ダウンロードフェーズ");
    console.log("=".repeat(60));

    const imageContent = await downloadImageContent(messageId, env.LINE_CHANNEL_ACCESS_TOKEN);

    if (imageContent == '404') {
      console.log("ℹ️ 画像共有です（スキップ）");
      return;
    }

    if (!imageContent) {
      console.error("❌ 画像ダウンロード失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    const { data: imageData, mimeType } = imageContent;

    // [2] 即座に「編集中」メッセージを送信（Reply APIを使用）
    await sendEditingMessage(lineClient, replyToken);

    // [3] Loading Animationを表示（1対1チャットのみ）
    if (userId) {
      await showLoadingAnimation(userId, env.LINE_CHANNEL_ACCESS_TOKEN, DURATIONS.LOADING_ANIMATION_SECONDS);
    }

    // [4] Supabase Storageにオリジナル画像を保存
    console.log("\n" + "=".repeat(60));
    console.log("💾 オリジナル画像保存フェーズ");
    console.log("=".repeat(60));

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // [5] アメコミ風変換
    console.log("\n" + "=".repeat(60));
    console.log("🎨 アメコミ風変換フェーズ");
    console.log("=".repeat(60));

    let comicImageData;
    try {
      comicImageData = await convertToComicStyle(
        imageData,
        env.GEMINI_API_KEY,
        mimeType
      );
    } catch (error: any) {
      if (error?.isRateLimit) {
        console.error("❌ アメコミ風変換失敗: レート制限");
        if (userId) {
          await lineClient.pushMessage(userId, {
            type: "text",
            text: MESSAGE_TEMPLATES.ERROR_RATE_LIMIT,
          });
        }
        return;
      }
      throw error;
    }

    if (!comicImageData) {
      console.error("❌ アメコミ風変換失敗");
      if (userId) {
        await lineClient.pushMessage(userId, {
          type: "text",
          text: MESSAGE_TEMPLATES.ERROR_CONVERSION_FAILED,
        });
      }
      return;
    }

    console.log("✅ アメコミ風変換完了");

    // [6] アメコミ風画像をStorageにアップロード
    console.log("\n" + "=".repeat(60));
    console.log("📤 アメコミ風画像アップロードフェーズ");
    console.log("=".repeat(60));

    await uploadImage(
      supabase,
      env.BUCKET_NAME,
      imageData,
      "image/png",
      'preview'
    );

    const uploadResult = await uploadImage(
      supabase,
      env.BUCKET_NAME,
      comicImageData,
      "image/png",
      'original'
    );

    if (!uploadResult) {
      console.error("❌ アメコミ風画像のアップロード失敗");
      if (userId) {
        await lineClient.pushMessage(userId, {
          type: "text",
          text: MESSAGE_TEMPLATES.ERROR_UPLOAD_FAILED,
        });
      }
      return;
    }

    const comicUrl = uploadResult.url;
    const fileName = uploadResult.fileName;
    console.log(`✅ アメコミ風画像保存完了: ${comicUrl}`);

    // [7] hashIdを生成してLIFF URLを作成
    const hashId = generateHashId(fileName);
    const liffUrl = `https://liff.line.me/${env.LIFF_ID}/${hashId}`;
    const slidesUrl = `https://liff.line.me/${env.LIFF_ID}/`;
    console.log(`🔗 LIFF URL生成: ${liffUrl}`);
    console.log(`🔗 Slides URL生成: ${slidesUrl}`);

    // [8] LINE Push APIで画像とFlexMessageを送信
    console.log("\n" + "=".repeat(60));
    console.log("📤 LINE Push API 送信フェーズ");
    console.log("=".repeat(60));

    if (!userId) {
      console.error("❌ userIdが取得できません");
      return;
    }

    // 画像+FlexMessageを送信
    const pushSuccess = await pushComicImage(
      lineClient,
      userId,
      comicUrl,
      hashId,
      liffUrl,
      slidesUrl
    );

    if (pushSuccess) {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 処理完了: 画像とFlexMessageが送信されました！");
      console.log("=".repeat(60));
    } else {
      console.error("❌ Push API送信失敗");
    }
  } catch (error) {
    console.error("❌ 処理中にエラー発生:", error);
    if (userId) {
      try {
        const lineClient = createLineClient(env.LINE_CHANNEL_ACCESS_TOKEN);
        await lineClient.pushMessage(userId, {
          type: "text",
          text: MESSAGE_TEMPLATES.ERROR_PROCESSING_FAILED,
        });
      } catch (pushError) {
        console.error("❌ エラーメッセージ送信も失敗:", pushError);
      }
    }
  }
}

/**
 * メインハンドラー
 */
serve(async (req: Request) => {
  console.log("🚀 LINE Webhook受信");

  // 環境変数取得
  const env = getEnvVars();
  if (!env) {
    return new Response(
      JSON.stringify({ error: "Environment variables not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // POSTメソッドのみ受付
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // リクエストボディを取得
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    // 署名検証
    if (!signature) {
      console.error("❌ X-Line-Signatureヘッダーがありません");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔐 Webhook署名検証中...");
    const isValid = validateSignature(body, signature, env.LINE_CHANNEL_SECRET);

    if (!isValid) {
      console.error("❌ 署名検証失敗");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ 署名検証成功");

    // Webhookボディをパース
    const webhookBody: WebhookRequestBody = JSON.parse(body);

    // 友だち追加イベントを検出
    const followEvent = findFollowEvent(webhookBody.events);

    if (followEvent) {
      console.log("👋 友だち追加イベントを検出");

      // 非同期で友だち追加イベント処理を実行
      processFollowEvent(followEvent, env).catch((error) => {
        console.error("❌ 友だち追加イベント処理エラー:", error);
      });

      // 即座に200 OKを返す
      return new Response(JSON.stringify({ status: "processing_follow" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // テキストメッセージイベントを検出
    const textEvent = findTextMessageEvent(webhookBody.events);

    if (textEvent) {
      console.log("💬 テキストメッセージを検出");

      // 非同期でテキストメッセージ処理を実行
      processTextMessage(textEvent, env).catch((error) => {
        console.error("❌ テキストメッセージ処理エラー:", error);
      });

      // 即座に200 OKを返す
      return new Response(JSON.stringify({ status: "processing_text" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 画像メッセージイベントを検出
    const imageEvent = findImageMessageEvent(webhookBody.events);

    if (imageEvent) {
      console.log("📸 画像メッセージを検出");

      // 非同期で画像処理を実行
      processImageMessage(imageEvent, env).catch((error) => {
        console.error("❌ 画像メッセージ処理エラー:", error);
      });

      // 即座に200 OKを返す
      return new Response(JSON.stringify({ status: "processing_image" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // テキストでも画像でもない場合
    console.log("ℹ️ サポート対象外のメッセージタイプ（スキップ）");
    return new Response(JSON.stringify({ status: "ignored" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Webhookハンドラーエラー:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

console.log("🎉 LINE Webhook Edge Function起動完了");
