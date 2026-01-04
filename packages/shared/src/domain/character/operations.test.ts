import { describe, expect, it, beforeEach } from "vitest";
import {
  createCharacter,
  updateCharacter,
  addWound,
  healWound,
  addHistoryEntry,
  upsertRelationship,
  removeRelationship,
  toBorrowableView,
  canParticipateInSession,
  canDieInSession,
  canHavePermanentChanges,
  type CreateCharacterInput,
} from "./operations";
import { UnsafeIds } from "../primitives/ids";
import type { Character } from "./types";

// Test fixtures
// Fragments require at least 5 characters each
const VALID_CHARACTER_INPUT: CreateCharacterInput = {
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
  lending: "safe",
  isPublic: true,
};

describe("createCharacter", () => {
  const characterId = UnsafeIds.characterId(
    "550e8400-e29b-41d4-a716-446655440000",
  );
  const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");

  it("should create a valid character", () => {
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._tag).toBe("Character");
      expect(result.value.id).toBe(characterId);
      expect(result.value.ownerId).toBe(ownerId);
      expect(result.value.name).toBe("灰村のセド");
      expect(result.value.lending).toBe("safe");
      expect(result.value.isPublic).toBe(true);
      expect(result.value.history).toEqual([]);
      expect(result.value.relationships).toEqual([]);
      expect(result.value.currentWounds).toEqual([]);
    }
  });

  it("should default lending to 'safe' when not provided", () => {
    const input = { ...VALID_CHARACTER_INPUT, lending: undefined };
    const result = createCharacter(characterId, ownerId, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.lending).toBe("safe");
    }
  });

  it("should default isPublic to false when not provided", () => {
    const input = { ...VALID_CHARACTER_INPUT, isPublic: undefined };
    const result = createCharacter(characterId, ownerId, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isPublic).toBe(false);
    }
  });

  it("should return error for empty name", () => {
    const input = { ...VALID_CHARACTER_INPUT, name: "" };
    const result = createCharacter(characterId, ownerId, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.field).toBe("name");
    }
  });

  it("should return error for invalid lending setting", () => {
    const input = { ...VALID_CHARACTER_INPUT, lending: "invalid" };
    const result = createCharacter(characterId, ownerId, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.field).toBe("lending");
    }
  });
});

describe("updateCharacter", () => {
  let character: Character;

  beforeEach(() => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);
    if (result.isErr()) {
      throw new Error("Failed to create character for test");
    }
    character = result.value;
  });

  it("should update character name", () => {
    const result = updateCharacter(character, { name: "新しい名前" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.name).toBe("新しい名前");
      expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
        character.updatedAt.getTime(),
      );
    }
  });

  it("should update character title", () => {
    const result = updateCharacter(character, { title: "新しい称号" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.title).toBe("新しい称号");
    }
  });

  it("should update lending setting", () => {
    const result = updateCharacter(character, { lending: "all" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.lending).toBe("all");
    }
  });

  it("should update isPublic", () => {
    const result = updateCharacter(character, { isPublic: false });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.isPublic).toBe(false);
    }
  });

  it("should return error for invalid name", () => {
    const result = updateCharacter(character, { name: "" });

    expect(result.isErr()).toBe(true);
  });

  it("should not change other fields when updating one field", () => {
    const result = updateCharacter(character, { name: "新しい名前" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.title).toBe(character.title);
      expect(result.value.biography).toBe(character.biography);
      expect(result.value.lending).toBe(character.lending);
    }
  });
});

describe("Wound operations", () => {
  let character: Character;

  beforeEach(() => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);
    if (result.isErr()) {
      throw new Error("Failed to create character for test");
    }
    character = result.value;
  });

  describe("addWound", () => {
    it("should add a wound to character", () => {
      const updated = addWound(character, "深い傷");

      expect(updated.currentWounds).toContain("深い傷");
      expect(updated.currentWounds.length).toBe(1);
    });

    it("should add multiple wounds", () => {
      let updated = addWound(character, "深い傷");
      updated = addWound(updated, "心の傷");

      expect(updated.currentWounds).toEqual(["深い傷", "心の傷"]);
    });
  });

  describe("healWound", () => {
    it("should remove wound by index", () => {
      let updated = addWound(character, "傷1");
      updated = addWound(updated, "傷2");
      updated = healWound(updated, 0);

      expect(updated.currentWounds).toEqual(["傷2"]);
    });

    it("should handle out of bounds index gracefully", () => {
      const updated = healWound(character, 999);

      expect(updated.currentWounds).toEqual([]);
    });
  });
});

describe("History operations", () => {
  let character: Character;

  beforeEach(() => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);
    if (result.isErr()) {
      throw new Error("Failed to create character for test");
    }
    character = result.value;
  });

  it("should add history entry", () => {
    const updated = addHistoryEntry(character, {
      sessionId: "770e8400-e29b-41d4-a716-446655440002",
      dungeonName: "廃墟の塔",
      partyMembers: ["セド", "エレン"],
      outcome: "生還",
      wounds: ["軽傷"],
      date: new Date("2024-01-01"),
    });

    expect(updated.history.length).toBe(1);
    expect(updated.history[0].dungeonName).toBe("廃墟の塔");
  });
});

describe("Relationship operations", () => {
  let character: Character;

  beforeEach(() => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);
    if (result.isErr()) {
      throw new Error("Failed to create character for test");
    }
    character = result.value;
  });

  describe("upsertRelationship", () => {
    it("should add new relationship", () => {
      const updated = upsertRelationship(character, {
        characterId: "880e8400-e29b-41d4-a716-446655440003",
        characterName: "エレン",
        nature: "trust",
        detail: "共に戦った仲間",
      });

      expect(updated.relationships.length).toBe(1);
      expect(updated.relationships[0].characterName).toBe("エレン");
    });

    it("should update existing relationship", () => {
      const targetId = "880e8400-e29b-41d4-a716-446655440003";
      let updated = upsertRelationship(character, {
        characterId: targetId,
        characterName: "エレン",
        nature: "trust",
        detail: "共に戦った仲間",
      });

      updated = upsertRelationship(updated, {
        characterId: targetId,
        characterName: "エレン",
        nature: "rival",
        detail: "ライバルになった",
      });

      expect(updated.relationships.length).toBe(1);
      expect(updated.relationships[0].nature).toBe("rival");
    });
  });

  describe("removeRelationship", () => {
    it("should remove relationship", () => {
      const targetId = UnsafeIds.characterId(
        "880e8400-e29b-41d4-a716-446655440003",
      );
      let updated = upsertRelationship(character, {
        characterId: targetId,
        characterName: "エレン",
        nature: "trust",
        detail: "共に戦った仲間",
      });

      updated = removeRelationship(updated, targetId);

      expect(updated.relationships.length).toBe(0);
    });
  });
});

describe("toBorrowableView", () => {
  it("should convert public character to borrowable view", () => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const charResult = createCharacter(characterId, ownerId, {
      ...VALID_CHARACTER_INPUT,
      lending: "all",
      isPublic: true,
    });

    if (charResult.isErr()) {
      throw new Error("Failed to create character");
    }

    const result = toBorrowableView(charResult.value);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._tag).toBe("BorrowableCharacter");
      expect(result.value.lending).toBe("all");
    }
  });

  it("should return error for private character", () => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const charResult = createCharacter(characterId, ownerId, {
      ...VALID_CHARACTER_INPUT,
      lending: "private",
      isPublic: true,
    });

    if (charResult.isErr()) {
      throw new Error("Failed to create character");
    }

    const result = toBorrowableView(charResult.value);

    expect(result.isErr()).toBe(true);
  });

  it("should return error for non-public character", () => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const charResult = createCharacter(characterId, ownerId, {
      ...VALID_CHARACTER_INPUT,
      lending: "all",
      isPublic: false,
    });

    if (charResult.isErr()) {
      throw new Error("Failed to create character");
    }

    const result = toBorrowableView(charResult.value);

    expect(result.isErr()).toBe(true);
  });
});

describe("Session participation rules", () => {
  let character: Character;

  beforeEach(() => {
    const characterId = UnsafeIds.characterId(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    const ownerId = UnsafeIds.userId("660e8400-e29b-41d4-a716-446655440001");
    const result = createCharacter(characterId, ownerId, VALID_CHARACTER_INPUT);
    if (result.isErr()) {
      throw new Error("Failed to create character for test");
    }
    character = result.value;
  });

  describe("canParticipateInSession", () => {
    it("should return true for Character", () => {
      expect(canParticipateInSession(character)).toBe(true);
    });
  });

  describe("canDieInSession", () => {
    it("should return true for owner", () => {
      expect(canDieInSession(character, true)).toBe(true);
    });

    it("should return true for lending=all", () => {
      const result = updateCharacter(character, { lending: "all" });
      if (result.isErr()) {
        throw new Error("Failed to update character");
      }
      expect(canDieInSession(result.value, false)).toBe(true);
    });

    it("should return false for lending=safe when not owner", () => {
      expect(canDieInSession(character, false)).toBe(false);
    });

    describe("with BorrowableCharacter", () => {
      it("should return true for BorrowableCharacter with lending=all", () => {
        const updatedResult = updateCharacter(character, {
          lending: "all",
          isPublic: true,
        });
        if (updatedResult.isErr()) {
          throw new Error("Failed to update character");
        }
        const borrowableResult = toBorrowableView(updatedResult.value);
        if (borrowableResult.isErr()) {
          throw new Error("Failed to create borrowable view");
        }
        expect(canDieInSession(borrowableResult.value, false)).toBe(true);
      });

      it("should return false for BorrowableCharacter with lending=safe", () => {
        const updatedResult = updateCharacter(character, {
          lending: "safe",
          isPublic: true,
        });
        if (updatedResult.isErr()) {
          throw new Error("Failed to update character");
        }
        const borrowableResult = toBorrowableView(updatedResult.value);
        if (borrowableResult.isErr()) {
          throw new Error("Failed to create borrowable view");
        }
        expect(canDieInSession(borrowableResult.value, false)).toBe(false);
      });
    });
  });

  describe("canHavePermanentChanges", () => {
    it("should return true for owner", () => {
      expect(canHavePermanentChanges(character, true)).toBe(true);
    });

    it("should return false for lending=safe when not owner", () => {
      expect(canHavePermanentChanges(character, false)).toBe(false);
    });

    it("should return true for lending=all when not owner", () => {
      const result = updateCharacter(character, { lending: "all" });
      if (result.isErr()) {
        throw new Error("Failed to update character");
      }
      expect(canHavePermanentChanges(result.value, false)).toBe(true);
    });

    describe("with BorrowableCharacter", () => {
      it("should return true for BorrowableCharacter with lending=all", () => {
        const updatedResult = updateCharacter(character, {
          lending: "all",
          isPublic: true,
        });
        if (updatedResult.isErr()) {
          throw new Error("Failed to update character");
        }
        const borrowableResult = toBorrowableView(updatedResult.value);
        if (borrowableResult.isErr()) {
          throw new Error("Failed to create borrowable view");
        }
        expect(canHavePermanentChanges(borrowableResult.value, false)).toBe(
          true,
        );
      });

      it("should return false for BorrowableCharacter with lending=safe", () => {
        const updatedResult = updateCharacter(character, {
          lending: "safe",
          isPublic: true,
        });
        if (updatedResult.isErr()) {
          throw new Error("Failed to update character");
        }
        const borrowableResult = toBorrowableView(updatedResult.value);
        if (borrowableResult.isErr()) {
          throw new Error("Failed to create borrowable view");
        }
        expect(canHavePermanentChanges(borrowableResult.value, false)).toBe(
          false,
        );
      });
    });
  });
});
