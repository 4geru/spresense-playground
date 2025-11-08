/**
 * Gemini API処理モジュール
 *
 * 機能:
 * - 人・ポーズ判定
 * - アメコミ風画像変換
 */

import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// 人・ポーズ判定の結果型
export interface AnalysisResult {
  face_detected: "Yes" | "No";
  is_pose: "Yes" | "No";
}

// Geminiクライアントの初期化
export function createGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 人・ポーズ判定を実行
 *
 * @param imageData - 画像のバイナリデータ（base64エンコード済み）
 * @param apiKey - Gemini API Key
 * @returns 判定結果 {face_detected: "Yes/No", is_pose: "Yes/No"}
 */
export async function analyzePersonAndPose(
  imageData: string,
  apiKey: string,
  mimeType: string = "image/jpeg"
): Promise<AnalysisResult | null> {
  try {
    const genAI = createGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `この画像について分析してください。
1. 人の顔は映っていますか？ (Yes/No)
2. 映っている場合、その人はカメラに向かって何かポーズ（ピースサイン、グッドサイン、ガッツポーズ）をしていますか？ (Yes/No)
結果を以下のJSON形式でのみ出力してください: {"face_detected": "Yes/No", "is_pose": "Yes/No"}`;

    console.log("🔍 Gemini AIで人・ポーズ判定中...");
    const startTime = Date.now();

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const endTime = Date.now();
    console.log(`⏱️ AI分析完了 (処理時間: ${(endTime - startTime) / 1000}秒)`);
    console.log(`🤖 AI応答: ${text}`);

    // JSON解析（Markdownコードブロック対応）
    let cleanedText = text.trim();

    // Markdownコードブロックを除去
    if (cleanedText.startsWith('```')) {
      const lines = cleanedText.split('\n');
      const jsonLines: string[] = [];
      let inCodeBlock = false;

      for (const line of lines) {
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }
        if (inCodeBlock || (!inCodeBlock && !line.startsWith('```'))) {
          jsonLines.push(line);
        }
      }

      cleanedText = jsonLines.join('\n').trim();
    }

    // シングルクォートをダブルクォートに変換
    if (cleanedText.startsWith("{'") && cleanedText.endsWith("'}")) {
      cleanedText = cleanedText.replace(/'/g, '"');
    }

    console.log(`🔧 解析用テキスト: ${cleanedText}`);

    try {
      const analysisResult: AnalysisResult = JSON.parse(cleanedText);

      console.log(`👁️  人の顔: ${analysisResult.face_detected}`);
      console.log(`🤲 ポーズ: ${analysisResult.is_pose}`);

      return analysisResult;
    } catch (jsonError) {
      console.error("❌ JSON解析エラー:", jsonError);
      console.log("🔄 フォールバック解析を試行...");

      // フォールバック: テキストから直接パース
      const lowerText = text.toLowerCase();
      const faceDetected = lowerText.includes('face_detected') && lowerText.includes('yes') ? 'Yes' : 'No';
      const isPose = lowerText.includes('is_pose') && lowerText.includes('yes') ? 'Yes' : 'No';

      const fallbackResult: AnalysisResult = {
        face_detected: faceDetected as "Yes" | "No",
        is_pose: isPose as "Yes" | "No",
      };

      console.log(`🔧 フォールバック結果: ${JSON.stringify(fallbackResult)}`);
      return fallbackResult;
    }
  } catch (error) {
    console.error("❌ Gemini API通信エラー:", error);
    return null;
  }
}

/**
 * アメコミ風変換を実行するか判定
 *
 * @param analysis - 分析結果
 * @returns 変換すべきかどうか
 */
export function shouldConvertToComic(analysis: AnalysisResult | null): boolean {
  if (!analysis) return false;

  const shouldConvert =
    analysis.face_detected.toLowerCase() === 'yes' &&
    analysis.is_pose.toLowerCase() === 'yes';

  if (shouldConvert) {
    console.log("✅ 🤖🤖🤖 条件マッチ: 人がいてポーズをしている → アメコミ風変換を実行 🤖🤖🤖");
  } else {
    console.log("❌ 条件不一致: アメコミ風変換をスキップ");
    console.log(`   - 人の顔: ${analysis.face_detected}`);
    console.log(`   - ポーズ: ${analysis.is_pose}`);
  }

  return shouldConvert;
}

/**
 * アメコミ風変換プロンプトを取得
 */
export function getComicStylePrompt(): string {
  return `Transform this image into American comic book style with the following specific elements:

1. BOLD OUTLINES: Add thick, strong black outlines around all characters and objects to create the distinctive comic book look with visual impact and character presence.

2. VIBRANT COLORS AND HIGH CONTRAST: Use bright, primary colors with high saturation and strong light-dark contrast. Adjust the photo's color tone to be brighter and more vivid. Express shadows clearly to emphasize three-dimensional effect.

3. ACTION LINES AND SPEED LINES: Add concentration lines and speed lines in the background to express movement, emotion, and impact. This creates dynamism and energy throughout the entire image.

4. ONOMATOPOEIA (SOUND EFFECTS): Place bold sound effect text like "POW!", "CHOMP!", "SLURP!", "ZZZ!" strategically. These visual sound effects should reinforce the visual information and instantly convey situations and emotions to viewers. Design the text in hand-drawn style with bold fonts following classic comic book typography.

5. HALFTONE (DOT) EXPRESSION: Apply small dot (halftone) textures to backgrounds and shadow areas, which is a classic comic book expression born from printing technology constraints. This creates a retro comic book atmosphere.

6. EXAGGERATED EMOTIONS: Make facial expressions more pronounced and expressive, incorporating the emotional exaggeration characteristic of comic book characters. Enlarge smiles and make expressions more dramatic.

Combine these elements to not just process the photo, but to recreate the visual language and expression style specific to the American comic book genre.`;
}

/**
 * アメコミ風画像変換を実行
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
    const genAI = createGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const comicPrompt = getComicStylePrompt();

    console.log("🎨 アメコミ風変換開始...");
    console.log("⏳ Gemini APIに送信中...");

    const startTime = Date.now();

    const result = await model.generateContent([
      `Edit this image: ${comicPrompt}`,
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const response = await result.response;

    const endTime = Date.now();
    console.log(`✨ レスポンス受信完了 (処理時間: ${(endTime - startTime) / 1000}秒)`);

    // 画像データを抽出
    // Gemini APIの応答から画像データを取得
    // Note: Gemini 2.0 Flash の画像生成APIの応答形式に応じて調整が必要

    // 現時点では、Gemini APIの画像編集機能の応答形式を確認する必要があります
    // 仮実装：最初のパートから画像データを取得
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("❌ 応答にcandidatesがありません");
      return null;
    }

    const parts = candidates[0].content.parts;
    for (const part of parts) {
      // inlineDataが含まれている場合
      if ('inlineData' in part && part.inlineData) {
        console.log("💾 編集画像データ取得完了");
        return part.inlineData.data;
      }
    }

    console.error("⚠️ 編集画像が生成されませんでした");
    return null;

  } catch (error) {
    console.error("❌ アメコミ風変換エラー:", error);
    return null;
  }
}
