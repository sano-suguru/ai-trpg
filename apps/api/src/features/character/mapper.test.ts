import { describe, expect, it } from "vitest";
import { toDomain, toNewRow, toUpdateRow } from "./mapper";
import { UnsafeIds, createCharacter } from "@ai-trpg/shared/domain";
import type {
  CharacterRow,
  CharacterFragmentsJson,
  CharacterDirectivesJson,
} from "../../infrastructure/database/schema";

// ========================================
// Test Fixtures
// ========================================

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const OWNER_UUID = "660e8400-e29b-41d4-a716-446655440001";
const SESSION_UUID = "770e8400-e29b-41d4-a716-446655440002";
const RELATED_CHAR_UUID = "880e8400-e29b-41d4-a716-446655440003";

const VALID_FRAGMENTS_JSON: CharacterFragmentsJson = {
  origin: { category: "origin", text: "かつて栄えた灰村の出身である" },
  loss: { category: "loss", text: "大切な家族を災厄で失った" },
  mark: { category: "mark", text: "右頬に深い傷跡がある" },
  sin: null,
  quest: null,
  trait: null,
};

const VALID_DIRECTIVES_JSON: CharacterDirectivesJson = {
  danger: "慎重に行動する",
  ally_in_peril: "仲間を助ける",
  moral_choice: "正義を選ぶ",
  unknown: "調査する",
};

function createValidRow(overrides: Partial<CharacterRow> = {}): CharacterRow {
  const now = new Date();
  return {
    id: VALID_UUID,
    ownerId: OWNER_UUID,
    name: "灰村のセド",
    title: "朽ちた塔の探索者",
    biography: "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
    fragments: VALID_FRAGMENTS_JSON,
    directives: VALID_DIRECTIVES_JSON,
    voiceSamples: [],
    history: [],
    relationships: [],
    currentWounds: [],
    currentQuestions: [],
    lending: "safe",
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ========================================
// toDomain Tests
// ========================================

describe("toDomain", () => {
  it("should convert valid row to domain model", () => {
    const row = createValidRow();
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._tag).toBe("Character");
      expect(result.value.id).toBe(VALID_UUID);
      expect(result.value.ownerId).toBe(OWNER_UUID);
      expect(result.value.name).toBe("灰村のセド");
      expect(result.value.title).toBe("朽ちた塔の探索者");
      expect(result.value.lending).toBe("safe");
      expect(result.value.isPublic).toBe(false);
    }
  });

  it("should convert fragments correctly", () => {
    const row = createValidRow({
      fragments: {
        ...VALID_FRAGMENTS_JSON,
        sin: { category: "sin", text: "かつて仲間を見捨てた臆病者" },
        quest: { category: "quest", text: "故郷を滅ぼした者への復讐を誓う" },
        trait: { category: "trait", text: "口数が少なく無口である" },
      },
    });
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.fragments.origin.text).toBe(
        "かつて栄えた灰村の出身である",
      );
      expect(result.value.fragments.loss.text).toBe("大切な家族を災厄で失った");
      expect(result.value.fragments.sin?.text).toBe(
        "かつて仲間を見捨てた臆病者",
      );
      expect(result.value.fragments.quest?.text).toBe(
        "故郷を滅ぼした者への復讐を誓う",
      );
      expect(result.value.fragments.trait?.text).toBe("口数が少なく無口である");
    }
  });

  it("should convert directives correctly", () => {
    const row = createValidRow();
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.directives.danger.response).toBe("慎重に行動する");
      expect(result.value.directives.allyInPeril.response).toBe("仲間を助ける");
      expect(result.value.directives.moralChoice.response).toBe("正義を選ぶ");
      expect(result.value.directives.unknown.response).toBe("調査する");
    }
  });

  it("should convert history entries correctly", () => {
    const row = createValidRow({
      history: [
        {
          sessionId: SESSION_UUID,
          dungeonName: "廃墟の塔",
          partyMembers: ["セド", "エレン"],
          outcome: "生還",
          wounds: ["軽傷"],
          date: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.history.length).toBe(1);
      expect(result.value.history[0].sessionId).toBe(SESSION_UUID);
      expect(result.value.history[0].dungeonName).toBe("廃墟の塔");
      expect(result.value.history[0].partyMembers).toEqual(["セド", "エレン"]);
      expect(result.value.history[0].date).toBeInstanceOf(Date);
    }
  });

  it("should convert relationships correctly", () => {
    const row = createValidRow({
      relationships: [
        {
          characterId: RELATED_CHAR_UUID,
          characterName: "エレン",
          nature: "trust",
          detail: "共に戦った仲間",
        },
      ],
    });
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.relationships.length).toBe(1);
      expect(result.value.relationships[0].characterId).toBe(RELATED_CHAR_UUID);
      expect(result.value.relationships[0].characterName).toBe("エレン");
      expect(result.value.relationships[0].nature).toBe("trust");
    }
  });

  it("should convert voice samples correctly", () => {
    const row = createValidRow({
      voiceSamples: [{ situation: "戦闘開始時", sample: "覚悟はできている" }],
    });
    const result = toDomain(row);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.voiceSamples.length).toBe(1);
      expect(result.value.voiceSamples[0].situation).toBe("戦闘開始時");
      expect(result.value.voiceSamples[0].sample).toBe("覚悟はできている");
    }
  });

  it("should return error for invalid name", () => {
    const row = createValidRow({ name: "" });
    const result = toDomain(row);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.field).toBe("name");
    }
  });

  it("should return error for invalid lending setting", () => {
    const row = createValidRow({
      lending: "invalid" as "all" | "safe" | "private",
    });
    const result = toDomain(row);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.field).toBe("lending");
    }
  });
});

// ========================================
// toNewRow Tests
// ========================================

describe("toNewRow", () => {
  it("should convert domain model to new row", () => {
    const characterId = UnsafeIds.characterId(VALID_UUID);
    const ownerId = UnsafeIds.userId(OWNER_UUID);

    const charResult = createCharacter(characterId, ownerId, {
      name: "灰村のセド",
      title: "朽ちた塔の探索者",
      biography:
        "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
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
      isPublic: false,
    });

    expect(charResult.isOk()).toBe(true);
    if (charResult.isErr()) return;

    const row = toNewRow(charResult.value);

    expect(row.id).toBe(VALID_UUID);
    expect(row.ownerId).toBe(OWNER_UUID);
    expect(row.name).toBe("灰村のセド");
    expect(row.title).toBe("朽ちた塔の探索者");
    expect(row.lending).toBe("safe");
    expect(row.isPublic).toBe(false);
  });

  it("should convert fragments to JSON format", () => {
    const characterId = UnsafeIds.characterId(VALID_UUID);
    const ownerId = UnsafeIds.userId(OWNER_UUID);

    const charResult = createCharacter(characterId, ownerId, {
      name: "灰村のセド",
      title: "朽ちた塔の探索者",
      biography:
        "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
      fragments: {
        origin: "かつて栄えた灰村の出身である",
        loss: "大切な家族を災厄で失った",
        mark: "右頬に深い傷跡がある",
        sin: null,
        quest: null,
        trait: null,
      },
      directives: {
        danger: "慎重に行動する",
        allyInPeril: "仲間を助ける",
        moralChoice: "正義を選ぶ",
        unknown: "調査する",
      },
    });

    expect(charResult.isOk()).toBe(true);
    if (charResult.isErr()) return;

    const row = toNewRow(charResult.value);

    expect(row.fragments.origin.category).toBe("origin");
    expect(row.fragments.origin.text).toBe("かつて栄えた灰村の出身である");
    expect(row.fragments.loss.category).toBe("loss");
    expect(row.fragments.sin).toBeNull();
  });

  it("should convert directives to JSON format", () => {
    const characterId = UnsafeIds.characterId(VALID_UUID);
    const ownerId = UnsafeIds.userId(OWNER_UUID);

    const charResult = createCharacter(characterId, ownerId, {
      name: "灰村のセド",
      title: "朽ちた塔の探索者",
      biography:
        "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
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
    });

    expect(charResult.isOk()).toBe(true);
    if (charResult.isErr()) return;

    const row = toNewRow(charResult.value);

    expect(row.directives.danger).toBe("慎重に行動する");
    expect(row.directives.ally_in_peril).toBe("仲間を助ける");
    expect(row.directives.moral_choice).toBe("正義を選ぶ");
    expect(row.directives.unknown).toBe("調査する");
  });
});

// ========================================
// toUpdateRow Tests
// ========================================

describe("toUpdateRow", () => {
  it("should exclude id, ownerId, and createdAt from update row", () => {
    const characterId = UnsafeIds.characterId(VALID_UUID);
    const ownerId = UnsafeIds.userId(OWNER_UUID);

    const charResult = createCharacter(characterId, ownerId, {
      name: "灰村のセド",
      title: "朽ちた塔の探索者",
      biography:
        "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
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
    });

    expect(charResult.isOk()).toBe(true);
    if (charResult.isErr()) return;

    const row = toUpdateRow(charResult.value);

    // These fields should NOT exist on update row
    expect("id" in row).toBe(false);
    expect("ownerId" in row).toBe(false);
    expect("createdAt" in row).toBe(false);

    // These fields should exist
    expect(row.name).toBe("灰村のセド");
    expect(row.updatedAt).toBeInstanceOf(Date);
  });
});

// ========================================
// Round-trip Tests
// ========================================

describe("Round-trip conversion", () => {
  it("should preserve data through domain → row → domain conversion", () => {
    const characterId = UnsafeIds.characterId(VALID_UUID);
    const ownerId = UnsafeIds.userId(OWNER_UUID);

    const charResult = createCharacter(characterId, ownerId, {
      name: "灰村のセド",
      title: "朽ちた塔の探索者",
      biography:
        "かつて栄えた村で生まれ、今は灰となった故郷を離れて旅を続ける。",
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
      lending: "all",
      isPublic: true,
    });

    expect(charResult.isOk()).toBe(true);
    if (charResult.isErr()) return;

    const original = charResult.value;
    // toNewRow returns NewCharacterRow (insert type with optional fields)
    // but toDomain expects CharacterRow (select type with all required fields)
    // Since we're testing a valid domain object, all fields are present
    const row = toNewRow(original) as unknown as CharacterRow;
    const reconverted = toDomain(row);

    expect(reconverted.isOk()).toBe(true);
    if (reconverted.isErr()) return;

    const recovered = reconverted.value;

    // Core properties
    expect(recovered.id).toBe(original.id);
    expect(recovered.ownerId).toBe(original.ownerId);
    expect(recovered.name).toBe(original.name);
    expect(recovered.title).toBe(original.title);
    expect(recovered.biography).toBe(original.biography);
    expect(recovered.lending).toBe(original.lending);
    expect(recovered.isPublic).toBe(original.isPublic);

    // Fragments
    expect(recovered.fragments.origin.text).toBe(
      original.fragments.origin.text,
    );
    expect(recovered.fragments.loss.text).toBe(original.fragments.loss.text);
    expect(recovered.fragments.mark.text).toBe(original.fragments.mark.text);
    expect(recovered.fragments.sin?.text).toBe(original.fragments.sin?.text);
    expect(recovered.fragments.quest?.text).toBe(
      original.fragments.quest?.text,
    );
    expect(recovered.fragments.trait?.text).toBe(
      original.fragments.trait?.text,
    );

    // Directives
    expect(recovered.directives.danger.response).toBe(
      original.directives.danger.response,
    );
    expect(recovered.directives.allyInPeril.response).toBe(
      original.directives.allyInPeril.response,
    );
  });
});
