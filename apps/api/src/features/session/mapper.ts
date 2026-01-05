/**
 * Session & Replay Mapper
 *
 * DB行とドメインモデル間の変換
 */

import { Result, ok, err } from "neverthrow";
import {
  Session,
  SessionStatus,
  SessionStructure,
  TriggeredEvent,
  PlotScene,
  EventPriorities,
  isSessionStatus,
  UnsafeIds,
} from "@ai-trpg/shared/domain";
import type { CharacterId } from "@ai-trpg/shared/domain";
import type { FragmentCategory } from "@ai-trpg/shared/domain";
import type { ValidationError } from "@ai-trpg/shared/types";
import { Errors } from "@ai-trpg/shared/types";
import type {
  SessionRow,
  NewSessionRow,
  TriggeredEventJson,
  SessionStructureJson,
  PlotSceneJson,
} from "../../infrastructure/database/schema";
import type {
  Replay,
  ReplayHeader,
  ReplayFooter,
  Scene,
  PartyMemberInfo,
  CharacterChange,
  OutcomeType,
} from "@ai-trpg/shared/domain";
import { isOutcomeType, isScene, ChangeTypes } from "@ai-trpg/shared/domain";
import type { ChangeType } from "@ai-trpg/shared/domain";
import type {
  ReplayRow,
  NewReplayRow,
  ReplayHeaderJson,
  ReplayFooterJson,
  SceneJson,
  CharacterChangeJson,
} from "../../infrastructure/database/schema";

// ========================================
// Session: DB Row → Domain Model
// ========================================

/**
 * Session DB行からドメインモデルへ変換
 */
export function sessionToDomain(
  row: SessionRow,
): Result<Session, ValidationError> {
  // Validate status
  if (!isSessionStatus(row.status)) {
    return err(
      Errors.validation(`無効なセッションステータス: ${row.status}`, "status"),
    );
  }

  // Convert triggered events
  const triggeredEvents: TriggeredEvent[] = row.triggeredEvents.map((e) =>
    jsonToTriggeredEvent(e),
  );

  // Convert structure if present
  let structure: SessionStructure | null = null;
  if (row.structure) {
    structure = jsonToSessionStructure(row.structure);
  }

  // Convert party IDs
  const party: CharacterId[] = row.party.map((id) => UnsafeIds.characterId(id));

  return ok({
    id: UnsafeIds.sessionId(row.id),
    userId: UnsafeIds.userId(row.userId),
    dungeonId: UnsafeIds.dungeonId(row.dungeonId),
    party,
    status: row.status as SessionStatus,
    triggeredEvents,
    structure,
    replayId: row.replayId ? UnsafeIds.replayId(row.replayId) : null,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  });
}

// ========================================
// Session: Domain Model → DB Row
// ========================================

/**
 * Sessionドメインモデルから新規DB行への変換
 */
export function sessionToNewRow(session: Session): NewSessionRow {
  return {
    id: session.id as string,
    userId: session.userId as string,
    dungeonId: session.dungeonId as string,
    party: session.party.map((id) => id as string),
    status: session.status,
    triggeredEvents: session.triggeredEvents.map(triggeredEventToJson),
    structure: session.structure
      ? sessionStructureToJson(session.structure)
      : null,
    replayId: session.replayId as string | null,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}

/**
 * Session更新用の部分行への変換
 */
export function sessionToUpdateRow(
  session: Session,
): Omit<NewSessionRow, "id" | "userId" | "dungeonId" | "party" | "createdAt"> {
  return {
    status: session.status,
    triggeredEvents: session.triggeredEvents.map(triggeredEventToJson),
    structure: session.structure
      ? sessionStructureToJson(session.structure)
      : null,
    replayId: session.replayId as string | null,
    errorMessage: session.errorMessage,
    completedAt: session.completedAt,
  };
}

// ========================================
// Session JSON ⇔ Domain Helpers
// ========================================

function jsonToTriggeredEvent(json: TriggeredEventJson): TriggeredEvent {
  return {
    characterName: json.characterName,
    characterId: UnsafeIds.characterId(json.characterId),
    fragmentCategory: json.fragmentCategory as FragmentCategory,
    effect: json.effect,
    priority:
      json.priority === "high" ? EventPriorities.HIGH : EventPriorities.NORMAL,
  };
}

function triggeredEventToJson(event: TriggeredEvent): TriggeredEventJson {
  return {
    characterName: event.characterName,
    characterId: event.characterId as string,
    fragmentCategory:
      event.fragmentCategory as TriggeredEventJson["fragmentCategory"],
    effect: event.effect,
    priority: event.priority as "high" | "normal",
  };
}

function jsonToSessionStructure(json: SessionStructureJson): SessionStructure {
  return {
    opening: {
      scene: json.opening.scene,
      partyDynamic: json.opening.partyDynamic,
      hook: json.opening.hook,
    },
    scenes: json.scenes.map(jsonToPlotScene),
    climax: {
      confrontation: json.climax.confrontation,
      choiceBearer: json.climax.choiceBearer,
      resonancePayoff: json.climax.resonancePayoff,
    },
    resolution: {
      outcome: json.resolution.outcome,
      cost: json.resolution.cost,
      changed: json.resolution.changed,
    },
  };
}

function jsonToPlotScene(json: PlotSceneJson): PlotScene {
  return {
    number: json.number,
    title: json.title,
    summary: json.summary,
    characterFocus: json.characterFocus,
    triggeredResonance: json.triggeredResonance,
  };
}

function sessionStructureToJson(
  structure: SessionStructure,
): SessionStructureJson {
  return {
    opening: {
      scene: structure.opening.scene,
      partyDynamic: structure.opening.partyDynamic,
      hook: structure.opening.hook,
    },
    scenes: structure.scenes.map(plotSceneToJson),
    climax: {
      confrontation: structure.climax.confrontation,
      choiceBearer: structure.climax.choiceBearer,
      resonancePayoff: structure.climax.resonancePayoff,
    },
    resolution: {
      outcome: structure.resolution.outcome,
      cost: structure.resolution.cost,
      changed: structure.resolution.changed,
    },
  };
}

function plotSceneToJson(scene: PlotScene): PlotSceneJson {
  return {
    number: scene.number,
    title: scene.title,
    summary: scene.summary,
    characterFocus: scene.characterFocus,
    triggeredResonance: scene.triggeredResonance,
  };
}

// ========================================
// Replay: DB Row → Domain Model
// ========================================

/**
 * Replay DB行からドメインモデルへ変換
 */
export function replayToDomain(
  row: ReplayRow,
): Result<Replay, ValidationError> {
  // Validate header.outcomeType
  if (!isOutcomeType(row.header.outcomeType)) {
    return err(
      Errors.validation(
        `無効な結末タイプ: ${row.header.outcomeType}`,
        "header.outcomeType",
      ),
    );
  }

  // Validate scenes
  for (const scene of row.scenes) {
    if (!isScene(scene)) {
      return err(Errors.validation("無効なシーンデータ", "scenes"));
    }
  }

  return ok({
    id: UnsafeIds.replayId(row.id),
    sessionId: UnsafeIds.sessionId(row.sessionId),
    header: jsonToReplayHeader(row.header),
    epigraph: row.epigraph,
    scenes: row.scenes.map(jsonToScene),
    epilogue: row.epilogue,
    footer: jsonToReplayFooter(row.footer),
    totalCharCount: row.totalCharCount,
    createdAt: row.createdAt,
  });
}

// ========================================
// Replay: Domain Model → DB Row
// ========================================

/**
 * Replayドメインモデルから新規DB行への変換
 */
export function replayToNewRow(replay: Replay): NewReplayRow {
  return {
    id: replay.id as string,
    sessionId: replay.sessionId as string,
    header: replayHeaderToJson(replay.header),
    epigraph: replay.epigraph,
    scenes: replay.scenes.map(sceneToJson),
    epilogue: replay.epilogue,
    footer: replayFooterToJson(replay.footer),
    totalCharCount: replay.totalCharCount,
    createdAt: replay.createdAt,
  };
}

// ========================================
// Replay JSON ⇔ Domain Helpers
// ========================================

function jsonToReplayHeader(json: ReplayHeaderJson): ReplayHeader {
  return {
    dungeonName: json.dungeonName,
    dungeonAlias: json.dungeonAlias,
    party: json.party.map(
      (p): PartyMemberInfo => ({
        id: UnsafeIds.characterId(p.id),
        name: p.name,
        title: p.title,
      }),
    ),
    depthReached: json.depthReached,
    outcomeType: json.outcomeType as OutcomeType,
  };
}

function replayHeaderToJson(header: ReplayHeader): ReplayHeaderJson {
  return {
    dungeonName: header.dungeonName,
    dungeonAlias: header.dungeonAlias,
    party: header.party.map((p) => ({
      id: p.id as string,
      name: p.name,
      title: p.title,
    })),
    depthReached: header.depthReached,
    outcomeType: header.outcomeType,
  };
}

function jsonToScene(json: SceneJson): Scene {
  return {
    number: json.number,
    title: json.title,
    text: json.text,
  };
}

function sceneToJson(scene: Scene): SceneJson {
  return {
    number: scene.number,
    title: scene.title,
    text: scene.text,
  };
}

function jsonToReplayFooter(json: ReplayFooterJson): ReplayFooter {
  return {
    sessionDate: json.sessionDate,
    survivors: json.survivors,
    characterChanges: json.characterChanges.map(
      (c): CharacterChange => ({
        characterId: UnsafeIds.characterId(c.characterId),
        characterName: c.characterName,
        changeType: (c.changeType === "wound"
          ? ChangeTypes.WOUND
          : c.changeType === "inner"
            ? ChangeTypes.INNER
            : c.changeType === "relationship"
              ? ChangeTypes.RELATIONSHIP
              : ChangeTypes.UNCHANGED) as ChangeType,
        description: c.description,
      }),
    ),
  };
}

function replayFooterToJson(footer: ReplayFooter): ReplayFooterJson {
  return {
    sessionDate: footer.sessionDate,
    survivors: footer.survivors,
    characterChanges: footer.characterChanges.map(
      (c): CharacterChangeJson => ({
        characterId: c.characterId as string,
        characterName: c.characterName,
        changeType: c.changeType as CharacterChangeJson["changeType"],
        description: c.description,
      }),
    ),
  };
}
