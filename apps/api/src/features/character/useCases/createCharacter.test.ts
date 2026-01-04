import { describe, expect, it, vi } from "vitest";
import { okAsync, errAsync } from "neverthrow";
import { createCharacterUseCase } from "./createCharacter";
import { UnsafeIds, type Character } from "@ai-trpg/shared/domain";
import { Errors } from "@ai-trpg/shared/types";
import type { CharacterRepository } from "../repository";

// ========================================
// Test Fixtures
// ========================================

const CHARACTER_UUID = "550e8400-e29b-41d4-a716-446655440000";
const USER_UUID = "660e8400-e29b-41d4-a716-446655440001";

const VALID_INPUT = {
  name: "灰村のセド",
  title: "朽ちた塔の探索者",
  biography: "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
  fragments: {
    origin: "かつて栄えた灰村の出身である",
    loss: "大切な家族を災厄で失った",
    mark: "右頬に深い傷跡がある",
    sin: "かつて仲間を見捨てた臆病者",
    quest: "故郷を滅ぼした者への復讐を誓う",
    trait: "口数が少なく無口である",
  },
  directives: {
    danger: "慎重に行動する",
    allyInPeril: "仲間を助ける",
    moralChoice: "正義を選ぶ",
    unknown: "調査する",
  },
  lending: "safe" as const,
  isPublic: false,
};

function createMockRepository(
  overrides: Partial<CharacterRepository> = {},
): CharacterRepository {
  return {
    findById: vi.fn().mockReturnValue(okAsync(null)),
    findByOwnerId: vi.fn().mockReturnValue(okAsync([])),
    findBorrowable: vi.fn().mockReturnValue(okAsync([])),
    save: vi.fn().mockImplementation((char: Character) => okAsync(char)),
    update: vi.fn().mockImplementation((char: Character) => okAsync(char)),
    delete: vi.fn().mockReturnValue(okAsync(undefined)),
    ...overrides,
  };
}

// ========================================
// Tests
// ========================================

describe("createCharacterUseCase", () => {
  it("should create a character successfully", async () => {
    const repository = createMockRepository();
    const generateId = vi.fn().mockReturnValue(CHARACTER_UUID);
    const userId = UnsafeIds.userId(USER_UUID);

    const useCase = createCharacterUseCase({ repository, generateId });
    const result = await useCase(userId, VALID_INPUT);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._tag).toBe("Character");
      expect(result.value.id).toBe(CHARACTER_UUID);
      expect(result.value.ownerId).toBe(USER_UUID);
      expect(result.value.name).toBe("灰村のセド");
    }
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it("should use generated ID for the character", async () => {
    const repository = createMockRepository();
    const generateId = vi.fn().mockReturnValue(CHARACTER_UUID);
    const userId = UnsafeIds.userId(USER_UUID);

    const useCase = createCharacterUseCase({ repository, generateId });
    await useCase(userId, VALID_INPUT);

    expect(generateId).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: CHARACTER_UUID }),
    );
  });

  it("should return validation error for invalid input", async () => {
    const repository = createMockRepository();
    const generateId = vi.fn().mockReturnValue(CHARACTER_UUID);
    const userId = UnsafeIds.userId(USER_UUID);

    const useCase = createCharacterUseCase({ repository, generateId });
    const result = await useCase(userId, { ...VALID_INPUT, name: "" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("should propagate repository errors", async () => {
    const dbError = Errors.database("read", "Connection failed");
    const repository = createMockRepository({
      save: vi.fn().mockReturnValue(errAsync(dbError)),
    });
    const generateId = vi.fn().mockReturnValue(CHARACTER_UUID);
    const userId = UnsafeIds.userId(USER_UUID);

    const useCase = createCharacterUseCase({ repository, generateId });
    const result = await useCase(userId, VALID_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe("DATABASE_ERROR");
    }
  });

  it("should set default values correctly", async () => {
    const repository = createMockRepository();
    const generateId = vi.fn().mockReturnValue(CHARACTER_UUID);
    const userId = UnsafeIds.userId(USER_UUID);

    const minimalInput = {
      name: "テストキャラ",
      title: "",
      biography: "",
      fragments: {
        origin: "かつて栄えた灰村の出身である",
        loss: "大切な家族を災厄で失った",
        mark: "右頬に深い傷跡がある",
      },
      directives: {
        danger: "慎重に行動する",
        allyInPeril: "仲間を助ける",
        moralChoice: "正義を選ぶ",
        unknown: "調査する",
      },
    };

    const useCase = createCharacterUseCase({ repository, generateId });
    const result = await useCase(userId, minimalInput);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // Default values should be applied
      expect(result.value.lending).toBe("safe");
      expect(result.value.isPublic).toBe(false);
      expect(result.value.history).toEqual([]);
      expect(result.value.relationships).toEqual([]);
      expect(result.value.currentWounds).toEqual([]);
    }
  });
});
