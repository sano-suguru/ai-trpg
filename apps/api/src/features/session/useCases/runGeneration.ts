/**
 * セッション生成実行ユースケース
 *
 * セッション生成パイプラインを実行し、リプレイを生成
 */

import { ResultAsync, err, ok } from "neverthrow";
import {
  Session,
  SessionId,
  UserId,
  SessionStatuses,
  startGenerating,
  setStructure,
  completeSession,
  failSession,
  UnsafeIds,
} from "@ai-trpg/shared/domain";
import type { Replay, Character } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { LLMServiceError } from "../../../services/llm/types";
import type { LLMProvider } from "../../../services/llm/types";
import type { SessionRepository, ReplayRepository } from "../repository";
import type { DungeonRepository } from "../../dungeon/repository";
import type { CharacterRepository } from "../../character/repository";
import {
  runGenerationPipeline,
  type ProgressCallback,
} from "../../../services/generation";

// ========================================
// Input / Output
// ========================================

export interface RunGenerationInput {
  readonly sessionId: SessionId;
  readonly userId: UserId;
}

export interface RunGenerationOutput {
  readonly session: Session;
  readonly replay: Replay;
  readonly characters: readonly Character[];
}

// ========================================
// Dependencies
// ========================================

export interface RunGenerationDeps {
  readonly sessionRepo: SessionRepository;
  readonly replayRepo: ReplayRepository;
  readonly dungeonRepo: DungeonRepository;
  readonly characterRepo: CharacterRepository;
  /** LLMプロバイダー（フォールバック戦略で選択済み） */
  readonly llmProvider: LLMProvider;
  readonly generateId: () => string;
  readonly onProgress?: ProgressCallback;
}

// ========================================
// Use Case
// ========================================

/**
 * セッション生成を実行
 *
 * 1. セッション取得・状態確認
 * 2. ダンジョン・キャラクター取得
 * 3. 生成パイプライン実行
 * 4. リプレイ保存
 * 5. セッション更新
 */
export function runGenerationUseCase(
  input: RunGenerationInput,
  deps: RunGenerationDeps,
): ResultAsync<RunGenerationOutput, AppError> {
  const { sessionId, userId } = input;
  const {
    sessionRepo,
    replayRepo,
    dungeonRepo,
    characterRepo,
    llmProvider,
    generateId,
    onProgress,
  } = deps;

  // セッション取得
  return sessionRepo
    .findById(sessionId)
    .andThen((session) => {
      if (!session) {
        return err(Errors.notFound("Session", sessionId as string));
      }

      // 所有権チェック
      if (session.userId !== userId) {
        return err(
          Errors.forbidden("このセッションにアクセスする権限がありません"),
        );
      }

      // 状態チェック（pendingのみ実行可能）
      if (session.status !== SessionStatuses.PENDING) {
        return err(
          Errors.validation(
            `セッションは${session.status}状態のため生成できません`,
            "status",
          ),
        );
      }

      return ok(session);
    })
    .andThen((session) => {
      // ダンジョン取得
      return dungeonRepo.findById(session.dungeonId).andThen((dungeon) => {
        if (!dungeon) {
          return err(Errors.notFound("Dungeon", session.dungeonId as string));
        }
        return ok({ session, dungeon });
      });
    })
    .andThen(({ session, dungeon }) => {
      // パーティメンバー取得
      return ResultAsync.combine(
        session.party.map((charId) => characterRepo.findById(charId)),
      ).andThen((characters) => {
        const party: Character[] = [];
        for (let i = 0; i < characters.length; i++) {
          const char = characters[i];
          if (!char) {
            return err(
              Errors.notFound("Character", session.party[i] as string),
            );
          }
          party.push(char);
        }
        return ok({ session, dungeon, party });
      });
    })
    .andThen(({ session, dungeon, party }) => {
      // 生成開始状態に更新（triggeredEventsは後で設定）
      const startResult = startGenerating(session, []);
      if (startResult.isErr()) {
        return err(Errors.validation(startResult.error.message, "session"));
      }

      return sessionRepo.update(startResult.value).map((updatedSession) => ({
        session: updatedSession,
        dungeon,
        party,
      }));
    })
    .andThen(({ session, dungeon, party }) => {
      // リプレイID生成
      const replayId = UnsafeIds.replayId(generateId());

      // 生成パイプライン実行
      return runGenerationPipeline(
        {
          sessionId,
          party,
          dungeon,
        },
        {
          llmProvider,
        },
        replayId,
        onProgress,
      )
        .map((result) => ({
          session,
          result,
          party,
        }))
        .mapErr((llmError: LLMServiceError) => {
          // LLMエラーをAppErrorに変換
          return Errors.llm(llmError.provider ?? "unknown", llmError.message);
        });
    })
    .andThen(({ session, result, party }) => {
      // リプレイ保存
      return replayRepo.save(result.replay).map((savedReplay) => ({
        session,
        replay: savedReplay,
        triggeredEvents: result.triggeredEvents,
        plot: result.plot,
        party,
      }));
    })
    .andThen(({ session, replay, triggeredEvents, plot, party }) => {
      // セッション構造を設定
      const structure = {
        opening: plot.opening,
        scenes: plot.scenes,
        climax: plot.climax,
        resolution: plot.resolution,
      };

      const withStructure = setStructure(
        { ...session, triggeredEvents },
        structure,
      );
      if (withStructure.isErr()) {
        return err(Errors.validation(withStructure.error.message, "structure"));
      }

      // 完了状態に更新
      const completed = completeSession(withStructure.value, replay.id);
      if (completed.isErr()) {
        return err(Errors.validation(completed.error.message, "complete"));
      }

      return sessionRepo.update(completed.value).map((finalSession) => ({
        session: finalSession,
        replay,
        characters: party,
      }));
    })
    .orElse((error) => {
      // エラー時はセッションを失敗状態に更新
      return sessionRepo
        .findById(sessionId)
        .andThen((session) => {
          if (!session) {
            return err(error);
          }

          const failed = failSession(session, error.message);
          if (failed.isErr()) {
            return err(error);
          }

          return sessionRepo.update(failed.value).andThen(() => err(error));
        })
        .orElse(() => err(error));
    });
}
