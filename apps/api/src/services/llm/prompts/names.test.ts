import { describe, expect, it } from "vitest";
import {
  buildNamesPrompt,
  NAMES_SYSTEM_PROMPT,
  parseNamesResponse,
} from "./names";

describe("names prompt", () => {
  describe("NAMES_SYSTEM_PROMPT", () => {
    it("should be a non-empty string containing key instructions", () => {
      expect(NAMES_SYSTEM_PROMPT.length).toBeGreaterThan(100);
      expect(NAMES_SYSTEM_PROMPT).toContain("灰暦の世界");
      expect(NAMES_SYSTEM_PROMPT).toContain("セキュリティルール");
    });
  });

  describe("buildNamesPrompt", () => {
    it("should build prompt with biography and fragments", () => {
      // NameGenerationInputはBiographyGenerationInputを要求するが、
      // 名前生成では origin と mark のみを参照する
      const input = {
        biography: "戦争で故郷を失った元兵士",
        fragments: {
          origin: "灰村",
          loss: "故郷の焼失", // 型上必須だが名前生成では未使用
          mark: "左頬の傷跡",
        },
      };

      const prompt = buildNamesPrompt(input);

      expect(prompt).toContain("<user_input>");
      expect(prompt).toContain("</user_input>");
      expect(prompt).toContain("戦争で故郷を失った元兵士");
      expect(prompt).toContain("灰村");
      expect(prompt).toContain("左頬の傷跡");
      expect(prompt).toContain("5個"); // default count
    });

    it("should use custom count when provided", () => {
      const input = {
        biography: "旅の商人",
        fragments: {
          origin: "交易都市",
          loss: "商売仲間との別れ",
          mark: "商人の紋章",
        },
        count: 3,
      };

      const prompt = buildNamesPrompt(input);

      expect(prompt).toContain("3個");
    });

    it("should handle optional fragments gracefully", () => {
      // 必須フィールドのみ、オプショナルフィールドなし
      const input = {
        biography: "謎の旅人",
        fragments: {
          origin: "不明",
          loss: "記憶",
          mark: "なし",
        },
      };

      const prompt = buildNamesPrompt(input);

      // origin と mark が JSON に含まれることを確認
      expect(prompt).toContain('"origin": "不明"');
      expect(prompt).toContain('"mark": "なし"');
    });
  });

  describe("parseNamesResponse", () => {
    it("should parse simple line-separated names", () => {
      const response = `灰村のセド
朽ちた塔のエレン
鍛冶師の娘リラ`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should remove bullet points", () => {
      const response = `- 灰村のセド
・ 朽ちた塔のエレン
* 鍛冶師の娘リラ`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should remove numbered list prefixes", () => {
      const response = `1. 灰村のセド
2) 朽ちた塔のエレン
3. 鍛冶師の娘リラ`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should remove quotes", () => {
      const response = `「灰村のセド」
"朽ちた塔のエレン"
『鍛冶師の娘リラ』`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should filter empty lines", () => {
      const response = `灰村のセド

朽ちた塔のエレン

`;

      const names = parseNamesResponse(response);

      expect(names).toEqual(["灰村のセド", "朽ちた塔のエレン"]);
    });

    it("should filter lines shorter than 2 characters", () => {
      const response = `灰村のセド
a
朽ちた塔のエレン`;

      const names = parseNamesResponse(response);

      expect(names).toEqual(["灰村のセド", "朽ちた塔のエレン"]);
    });

    it("should keep exactly 2-character names", () => {
      const response = `灰村のセド
ab
セド`;

      const names = parseNamesResponse(response);

      // "ab" and "セド" are exactly 2 characters, should be kept
      expect(names).toEqual(["灰村のセド", "ab", "セド"]);
    });

    it("should trim whitespace from lines", () => {
      const response = `  灰村のセド
	朽ちた塔のエレン
   鍛冶師の娘リラ   `;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should handle bullet without trailing space", () => {
      // Test: /^[-・*•]\s*/ with \s* allowing zero spaces
      const response = `-灰村のセド
・朽ちた塔のエレン
*鍛冶師の娘リラ`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should only remove bullet at start of line", () => {
      // Test: ^ anchor - bullet mid-string should be preserved
      const response = `灰村-のセド
朽ちた・塔のエレン`;

      const names = parseNamesResponse(response);

      expect(names).toEqual(["灰村-のセド", "朽ちた・塔のエレン"]);
    });

    it("should handle double-digit numbered lists", () => {
      // Test: \d+ matching multiple digits
      const response = `10. 灰村のセド
11) 朽ちた塔のエレン
123. 鍛冶師の娘リラ`;

      const names = parseNamesResponse(response);

      expect(names).toEqual([
        "灰村のセド",
        "朽ちた塔のエレン",
        "鍛冶師の娘リラ",
      ]);
    });

    it("should handle numbered list without trailing space", () => {
      // Test: \s* allowing zero spaces after number
      const response = `1.灰村のセド
2)朽ちた塔のエレン`;

      const names = parseNamesResponse(response);

      expect(names).toEqual(["灰村のセド", "朽ちた塔のエレン"]);
    });

    it("should only remove number at start of line", () => {
      // Test: ^ anchor - number mid-string should be preserved
      const response = `灰村の1番セド
朽ちた2.塔のエレン`;

      const names = parseNamesResponse(response);

      expect(names).toEqual(["灰村の1番セド", "朽ちた2.塔のエレン"]);
    });

    it("should only remove quotes at boundaries", () => {
      // Test: ^ and $ anchors - quotes mid-string should be preserved
      const response = `灰村の「セド」様
朽ちた"塔"のエレン`;

      const names = parseNamesResponse(response);

      // Mid-string quotes should be preserved
      expect(names).toEqual(["灰村の「セド」様", '朽ちた"塔"のエレン']);
    });

    it("should limit to 10 names", () => {
      const response = Array.from(
        { length: 15 },
        (_, i) => `名前${i + 1}`,
      ).join("\n");

      const names = parseNamesResponse(response);

      expect(names).toHaveLength(10);
    });
  });
});
