import { describe, expect, it } from "vitest";
import {
  asBrand,
  createBrandGuard,
  isNonEmptyString,
  isValidUuid,
  type Brand,
} from "./brand";

describe("brand utilities", () => {
  describe("asBrand", () => {
    it("should brand a value", () => {
      type UserId = Brand<string, "UserId">;
      const userId: UserId = asBrand<"UserId">("user-123");
      expect(userId).toBe("user-123");
    });
  });

  describe("isValidUuid", () => {
    it("should return true for valid UUID", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("550e8400-e29b-41d4-a716")).toBe(false);
      expect(isValidUuid("")).toBe(false);
      expect(isValidUuid(123)).toBe(false);
      expect(isValidUuid(null)).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    it("should return true for non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString("  hello  ")).toBe(true);
      expect(isNonEmptyString("a")).toBe(true);
    });

    it("should return false for empty or whitespace-only strings", () => {
      expect(isNonEmptyString("")).toBe(false);
      expect(isNonEmptyString("   ")).toBe(false);
      expect(isNonEmptyString("\t\n")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe("createBrandGuard", () => {
    it("should create a working type guard", () => {
      type UserId = Brand<string, "UserId">;
      const isUserId = createBrandGuard<UserId>(isValidUuid);

      expect(isUserId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isUserId("not-a-uuid")).toBe(false);
    });
  });
});
