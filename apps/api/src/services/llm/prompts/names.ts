/**
 * 名前生成プロンプト
 *
 * 人物像から名前候補を生成するためのプロンプトテンプレート
 */

import type { NameGenerationInput } from "../types";

// ========================================
// System Prompt
// ========================================

export const NAMES_SYSTEM_PROMPT = `あなたは「灰暦の世界」というダークファンタジーTRPGのキャラクター名を提案するAIです。

【世界観】
- 中世ヨーロッパ風だが、独自の文化と歴史を持つ
- 神々は去り、英雄は朽ちた後の時代
- 様々な地域・文化圏が存在する

【命名の特徴】
- ファーストネーム＋出身地/二つ名の形式が一般的
  例: 「灰村のセド」「朽ちた塔のエレン」「鍛冶師の娘リラ」
- 名前は短く覚えやすいもの（2〜4音節）
- 出身地や特徴を示す二つ名/通り名を添える
- ダークファンタジーらしい重厚感

【出力形式】
- 指定された数だけ名前を提案
- 各名前は「名前」の形式（二つ名を含む完全な呼称）
- 1行に1つずつ、箇条書きなしで出力
- 余計な説明は不要`;

// ========================================
// User Prompt Builder
// ========================================

/**
 * 名前生成用のユーザープロンプトを構築
 */
export function buildNamesPrompt(input: NameGenerationInput): string {
  const count = input.count ?? 5;

  // 断片から文脈情報を抽出
  const contextParts: string[] = [];
  if (input.fragments.origin) {
    contextParts.push(`出身: ${input.fragments.origin}`);
  }
  if (input.fragments.mark) {
    contextParts.push(`特徴: ${input.fragments.mark}`);
  }

  return `以下の人物像を持つキャラクターの名前を${count}個提案してください。

【人物像】
${input.biography}

【参考情報】
${contextParts.join("\n")}

名前は「出身地/二つ名」＋「ファーストネーム」の形式で、世界観に合った重厚感のあるものを提案してください。
各名前は1行ずつ、余計な説明なしで出力してください。`;
}

// ========================================
// Response Parsing
// ========================================

/**
 * 生成結果から名前リストを抽出
 */
export function parseNamesResponse(text: string): string[] {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      // 空行を除去
      .filter((line) => line.length > 0)
      // 箇条書き記号を除去
      .map((line) => line.replace(/^[-・*•]\s*/, ""))
      // 番号付きリストの番号を除去
      .map((line) => line.replace(/^\d+[.)]\s*/, ""))
      // 引用符を除去
      .map((line) => line.replace(/^["「『]|["」』]$/g, ""))
      // 短すぎる行を除去
      .filter((line) => line.length >= 2)
      // 最大10個まで
      .slice(0, 10)
  );
}
