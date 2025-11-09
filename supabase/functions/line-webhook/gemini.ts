/**
 * Gemini API処理モジュール
 *
 * 機能:
 * - アメコミ風画像変換
 */

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";


// Geminiクライアントの初期化
export function createGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * アメコミ風変換プロンプトを取得
 */
export function getComicStylePrompt(): string {
  return `Transform this photo into American comic book style while PRESERVING the original composition, pose, and subject matter.

IMPORTANT: Keep the original elements - maintain the same people, their poses, positions, and the overall scene composition. DO NOT replace or drastically change the subjects.

Apply the following comic book visual effects to enhance the original photo:

1. BOLD OUTLINES: Add thick, strong black outlines around the people and main objects while keeping their original shapes and positions intact.

2. VIBRANT COLORS WITH ORIGINAL TONES: Enhance the existing colors to be brighter and more saturated, but maintain the original color scheme. Increase contrast between light and shadow areas while preserving the photo's lighting direction.

3. ACTION LINES (SUBTLE): Add subtle speed lines or concentration lines in the background only where appropriate to the pose or action. Don't overpower the main subject.

4. ONOMATOPOEIA (OPTIONAL): If the pose clearly suggests action or emotion (like jumping, punching, celebrating), add one appropriate sound effect text like "POW!", "YEAH!", "BOOM!" in comic book style. Use sparingly and only when it fits naturally.

5. HALFTONE DOTS (BACKGROUNDS): Apply subtle halftone dot patterns primarily to background areas and some shadow regions, maintaining the original scene structure.

6. SLIGHT EXPRESSION ENHANCEMENT: Make facial expressions slightly more vivid while keeping them natural and recognizable as the original person.

CRITICAL: The result should look like the original photo enhanced with comic book visual effects, NOT a completely different illustration. Preserve the identity, pose, and composition of the original subjects at all costs.`;
}

/**
 * アメコミ風画像変換を実行（REST API直接呼び出し）
 *
 * @param imageData - 画像のバイナリデータ（base64エンコード済み）
 * @param apiKey - Gemini API Key
 * @param mimeType - 画像のMIMEタイプ
 * @returns 変換後の画像データ（base64）、失敗時はnull
 */
export async function convertToComicStyle(
  imageData: string,
  apiKey: string,
  mimeType: string = "image/jpeg"
): Promise<string | null> {
  try {
    const comicPrompt = getComicStylePrompt();

    console.log("🎨 アメコミ風変換開始...");
    console.log("⏳ Gemini REST APIに送信中...");
    console.log("📝 使用モデル: gemini-2.0-flash-exp");

    const startTime = Date.now();

    // REST API直接呼び出し
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Edit this image: ${comicPrompt}`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["Text", "Image"],
            temperature: 0.7,
          },
        }),
      }
    );

    const endTime = Date.now();
    console.log(`✨ レスポンス受信完了 (処理時間: ${(endTime - startTime) / 1000}秒)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API呼び出し失敗: ${response.status} ${response.statusText}`);
      console.error(`エラー詳細: ${errorText}`);

      // レート制限エラーの場合
      if (response.status === 429) {
        console.error("⚠️ Gemini APIレート制限に達しました");
        console.error("💡 1-2分待ってから再試行してください");
        throw { status: 429, isRateLimit: true, message: errorText };
      }

      return null;
    }

    const data = await response.json();

    // デバッグ: 応答全体をログ出力
    console.log("🔍 Gemini API応答の詳細:");
    console.log(`   - candidates存在: ${!!data.candidates}`);
    console.log(`   - candidates数: ${data.candidates?.length || 0}`);

    try {
      const responseJson = JSON.stringify(data, null, 2);
      console.log(`   - 応答全体（最初の500文字）: ${responseJson.substring(0, 500)}`);
    } catch (e) {
      console.log(`   - JSON変換失敗: ${e}`);
    }

    // 画像データを抽出
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("❌ 応答にcandidatesがありません");
      return null;
    }

    const parts = candidates[0].content.parts;
    console.log(`   - parts数: ${parts.length}`);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      console.log(`   - part[${i}]のキー: ${Object.keys(part).join(", ")}`);

      // inlineDataが含まれている場合（REST APIではcamelCase）
      if ("inlineData" in part && part.inlineData) {
        console.log("💾 編集画像データ取得完了");
        return part.inlineData.data;
      }
      // 念のためsnake_caseもチェック
      if ("inline_data" in part && part.inline_data) {
        console.log("💾 編集画像データ取得完了");
        return part.inline_data.data;
      }
    }

    console.error("⚠️ 編集画像が生成されませんでした");
    console.error("💡 応答にinline_dataが含まれていません");
    return null;
  } catch (error: any) {
    console.error("❌ アメコミ風変換エラー:", error);

    // レート制限エラーの場合は特別な処理
    if (
      error?.status === 429 ||
      error?.isRateLimit ||
      error?.message?.includes("429") ||
      error?.message?.includes("Too Many Requests")
    ) {
      console.error("⚠️ Gemini APIレート制限に達しました");
      console.error("💡 1-2分待ってから再試行してください");
      throw { ...error, isRateLimit: true };
    }

    return null;
  }
}
