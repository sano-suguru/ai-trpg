/**
 * Branded Type ユーティリティ
 *
 * TypeScriptの構造的型付けを名義的型付けに近づけるための
 * Branded Type（Nominal Type）パターンを提供
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type CharacterId = Brand<string, "CharacterId">;
 *
 * // これらは同じ string だが、型レベルで区別される
 * const userId: UserId = "user-123" as UserId;
 * const characterId: CharacterId = "char-456" as CharacterId;
 *
 * function getCharacter(id: CharacterId) { ... }
 * getCharacter(userId); // コンパイルエラー！
 * ```
 */

// ========================================
// Brand Type Definition
// ========================================

/**
 * ブランドを付与するためのユニークシンボル
 * このシンボルは実行時には存在せず、型レベルでのみ機能する
 */
declare const brand: unique symbol;

/**
 * ベース型にブランドを付与した型
 *
 * @typeParam T - ベースとなる型（string, number など）
 * @typeParam TBrand - ブランド名（リテラル型）
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type Amount = Brand<number, "Amount">;
 * ```
 */
export type Brand<T, TBrand extends string> = T & {
  readonly [brand]: TBrand;
};

// ========================================
// Brand Utilities
// ========================================

/**
 * 値にブランドを付与する（unsafe）
 * 値の検証は呼び出し側の責任
 *
 * @example
 * ```ts
 * // バリデーション後に使用
 * if (isValidUuid(value)) {
 *   const userId = asBrand<UserId>(value);
 * }
 * ```
 */
export function asBrand<TBrand extends string, TBase = string>(
  value: TBase,
): Brand<TBase, TBrand> {
  return value as Brand<TBase, TBrand>;
}

/**
 * Branded型からベース型を抽出
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type BaseType = Unbrand<UserId>; // string
 * ```
 */
export type Unbrand<T> = T extends Brand<infer U, string> ? U : T;

/**
 * Branded型のブランド名を抽出
 *
 * @example
 * ```ts
 * type UserId = Brand<string, "UserId">;
 * type BrandName = BrandOf<UserId>; // "UserId"
 * ```
 */
export type BrandOf<T> = T extends Brand<unknown, infer B> ? B : never;

// ========================================
// Type Guards
// ========================================

/**
 * 値が有効なBranded型かどうかを検証するための型ガード生成関数
 *
 * @param validator - ベース型の検証関数
 * @returns Branded型の型ガード
 *
 * @example
 * ```ts
 * const isUserId = createBrandGuard<UserId>(isValidUuid);
 * if (isUserId(unknownValue)) {
 *   // unknownValue は UserId 型として扱える
 * }
 * ```
 */
export function createBrandGuard<T extends Brand<unknown, string>>(
  validator: (value: unknown) => value is Unbrand<T>,
): (value: unknown) => value is T {
  return (value): value is T => validator(value);
}

// ========================================
// Branded String Utilities
// ========================================

/**
 * UUID形式の文字列かどうかを検証
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 空でない文字列かどうかを検証
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
