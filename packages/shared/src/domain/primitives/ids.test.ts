import { describe, expect, it } from "vitest";
import {
  createUserId,
  createCharacterId,
  createDungeonId,
  createSessionId,
  createReplayId,
  UnsafeIds,
  isUserId,
  isCharacterId,
  isDungeonId,
  isSessionId,
  isReplayId,
} from "./ids";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const INVALID_UUID = "not-a-uuid";

describe("Smart Constructors", () => {
  describe("createUserId", () => {
    it("should create UserId from valid UUID", () => {
      const result = createUserId(VALID_UUID);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(VALID_UUID);
      }
    });

    it("should return error for invalid UUID", () => {
      const result = createUserId(INVALID_UUID);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.field).toBe("userId");
      }
    });

    it("should return error for empty string", () => {
      const result = createUserId("");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("createCharacterId", () => {
    it("should create CharacterId from valid UUID", () => {
      const result = createCharacterId(VALID_UUID);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for invalid UUID", () => {
      const result = createCharacterId(INVALID_UUID);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("characterId");
      }
    });
  });

  describe("createDungeonId", () => {
    it("should create DungeonId from valid UUID", () => {
      const result = createDungeonId(VALID_UUID);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for invalid UUID", () => {
      const result = createDungeonId(INVALID_UUID);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("dungeonId");
      }
    });
  });

  describe("createSessionId", () => {
    it("should create SessionId from valid UUID", () => {
      const result = createSessionId(VALID_UUID);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for invalid UUID", () => {
      const result = createSessionId(INVALID_UUID);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("sessionId");
      }
    });
  });

  describe("createReplayId", () => {
    it("should create ReplayId from valid UUID", () => {
      const result = createReplayId(VALID_UUID);
      expect(result.isOk()).toBe(true);
    });

    it("should return error for invalid UUID", () => {
      const result = createReplayId(INVALID_UUID);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.field).toBe("replayId");
      }
    });
  });
});

describe("UnsafeIds", () => {
  it("should create UserId without validation", () => {
    const id = UnsafeIds.userId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("should create CharacterId without validation", () => {
    const id = UnsafeIds.characterId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("should create DungeonId without validation", () => {
    const id = UnsafeIds.dungeonId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("should create SessionId without validation", () => {
    const id = UnsafeIds.sessionId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("should create ReplayId without validation", () => {
    const id = UnsafeIds.replayId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("should allow invalid UUIDs (unsafe)", () => {
    // UnsafeIds bypasses validation - this is intentional for trusted sources
    const id = UnsafeIds.userId(INVALID_UUID);
    expect(id).toBe(INVALID_UUID);
  });
});

describe("Type Guards", () => {
  describe("isUserId", () => {
    it("should return true for valid UUID", () => {
      expect(isUserId(VALID_UUID)).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isUserId(INVALID_UUID)).toBe(false);
    });

    it("should return false for non-string", () => {
      expect(isUserId(123)).toBe(false);
      expect(isUserId(null)).toBe(false);
      expect(isUserId(undefined)).toBe(false);
    });
  });

  describe("isCharacterId", () => {
    it("should return true for valid UUID", () => {
      expect(isCharacterId(VALID_UUID)).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isCharacterId(INVALID_UUID)).toBe(false);
    });
  });

  describe("isDungeonId", () => {
    it("should return true for valid UUID", () => {
      expect(isDungeonId(VALID_UUID)).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isDungeonId(INVALID_UUID)).toBe(false);
    });
  });

  describe("isSessionId", () => {
    it("should return true for valid UUID", () => {
      expect(isSessionId(VALID_UUID)).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isSessionId(INVALID_UUID)).toBe(false);
    });
  });

  describe("isReplayId", () => {
    it("should return true for valid UUID", () => {
      expect(isReplayId(VALID_UUID)).toBe(true);
    });

    it("should return false for invalid UUID", () => {
      expect(isReplayId(INVALID_UUID)).toBe(false);
    });
  });
});
