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
  downloadImageContent,
  echoTextMessage,
  sendComicConversionResult,
  sendConditionNotMetMessage,
  sendErrorMessage,
} from "./line.ts";

import {
  analyzePersonAndPose,
  shouldConvertToComic,
  convertToComicStyle,
} from "./gemini.ts";

import { uploadImage, uploadOriginalOnly } from "./storage.ts";

// 環境変数の型定義
interface EnvVars {
  GEMINI_API_KEY: string;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BUCKET_NAME: string;
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
  };
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
    await echoTextMessage(lineClient, replyToken, text);
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
  const { replyToken, message } = event;
  const messageId = message?.id;

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

    if (!imageContent) {
      console.error("❌ 画像ダウンロード失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    const { data: imageData, mimeType } = imageContent;

    // [2] Supabase Storageにオリジナル画像を保存
    console.log("\n" + "=".repeat(60));
    console.log("💾 オリジナル画像保存フェーズ");
    console.log("=".repeat(60));

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const originalUrl = await uploadOriginalOnly(
      supabase,
      env.BUCKET_NAME,
      imageData,
      mimeType
    );

    if (!originalUrl) {
      console.error("❌ オリジナル画像の保存失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    console.log(`✅ オリジナル画像保存完了: ${originalUrl}`);

    // [3] Gemini AI分析（人・ポーズ判定）
    console.log("\n" + "=".repeat(60));
    console.log("🧠 AI画像分析フェーズ");
    console.log("=".repeat(60));

    let analysisResult;
    try {
      analysisResult = await analyzePersonAndPose(
        imageData,
        env.GEMINI_API_KEY,
        mimeType
      );
    } catch (error: any) {
      if (error?.isRateLimit) {
        console.error("❌ AI分析失敗: レート制限");
        await sendErrorMessage(lineClient, replyToken, "rate_limit");
        return;
      }
      throw error;
    }

    if (!analysisResult) {
      console.error("❌ AI分析失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    // [4] 条件判定
    console.log("\n" + "=".repeat(60));
    console.log("🎯 条件判定フェーズ");
    console.log("=".repeat(60));

    const convertNeeded = shouldConvertToComic(analysisResult);

    if (!convertNeeded) {
      // 条件不一致: 既にオリジナル画像は保存済みなので終了
      console.log("⏭️ アメコミ風変換をスキップ");
      console.log("📁 オリジナル画像は既に保存済み");

      // 条件不一致メッセージを返信
      await sendConditionNotMetMessage(
        lineClient,
        replyToken,
        analysisResult.face_detected,
        analysisResult.is_pose
      );

      return;
    }

    // [5] アメコミ風変換（条件マッチ時）
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
        await sendErrorMessage(lineClient, replyToken, "rate_limit");
        return;
      }
      throw error;
    }

    if (!comicImageData) {
      console.error("❌ アメコミ風変換失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    console.log("✅ アメコミ風変換完了");

    // [6] アメコミ風画像をStorageにアップロード
    console.log("\n" + "=".repeat(60));
    console.log("📤 アメコミ風画像アップロードフェーズ");
    console.log("=".repeat(60));

    const comicUrl = await uploadImage(
      supabase,
      env.BUCKET_NAME,
      comicImageData,
      "image/png",
      "comic"
    );

    if (!comicUrl) {
      console.error("❌ アメコミ風画像のアップロード失敗");
      await sendErrorMessage(lineClient, replyToken);
      return;
    }

    console.log(`✅ アメコミ風画像保存完了: ${comicUrl}`);

    // [7] LINE Reply APIで返信
    console.log("\n" + "=".repeat(60));
    console.log("📤 LINE Reply API 送信フェーズ");
    console.log("=".repeat(60));

    const replySuccess = await sendComicConversionResult(
      lineClient,
      replyToken,
      originalUrl,
      comicUrl
    );

    if (replySuccess) {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 処理完了: アメコミ風画像が送信されました！");
      console.log("=".repeat(60));
    } else {
      console.error("❌ Reply API送信失敗");
    }
  } catch (error) {
    console.error("❌ 処理中にエラー発生:", error);
    try {
      const lineClient = createLineClient(env.LINE_CHANNEL_ACCESS_TOKEN);
      await sendErrorMessage(lineClient, replyToken);
    } catch (replyError) {
      console.error("❌ エラーメッセージ送信も失敗:", replyError);
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
