/**
 * Session & Replay Repository
 *
 * セッションとリプレイの永続化を担当
 */

import { ResultAsync, ok, err } from "neverthrow";
import { eq, desc } from "drizzle-orm";
import {
  Session,
  SessionId,
  UserId,
  Replay,
  ReplayId,
} from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { Database } from "../../infrastructure/database/client";
import { sessions, replays } from "../../infrastructure/database/schema";
import {
  sessionToDomain,
  sessionToNewRow,
  sessionToUpdateRow,
  replayToDomain,
  replayToNewRow,
} from "./mapper";

// ========================================
// Session Repository Port (Interface)
// ========================================

export interface SessionRepository {
  findById(id: SessionId): ResultAsync<Session | null, AppError>;
  findByUserId(userId: UserId): ResultAsync<readonly Session[], AppError>;
  save(session: Session): ResultAsync<Session, AppError>;
  update(session: Session): ResultAsync<Session, AppError>;
}

// ========================================
// Session Repository Adapter (Implementation)
// ========================================

/**
 * Drizzle ORMを使用したSessionRepository実装
 */
export function createSessionRepository(db: Database): SessionRepository {
  return {
    findById(id: SessionId): ResultAsync<Session | null, AppError> {
      return ResultAsync.fromPromise(
        db.query.sessions.findFirst({
          where: eq(sessions.id, id as string),
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((row) => {
        if (!row) return ok(null);
        return sessionToDomain(row).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    findByUserId(userId: UserId): ResultAsync<readonly Session[], AppError> {
      return ResultAsync.fromPromise(
        db.query.sessions.findMany({
          where: eq(sessions.userId, userId as string),
          orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Session[] = [];
        for (const row of rows) {
          const result = sessionToDomain(row);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    save(session: Session): ResultAsync<Session, AppError> {
      const row = sessionToNewRow(session);
      return ResultAsync.fromPromise(
        db.insert(sessions).values(row).returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.database("write", "Failed to insert session"));
        }
        return sessionToDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    update(session: Session): ResultAsync<Session, AppError> {
      const updateData = sessionToUpdateRow(session);
      return ResultAsync.fromPromise(
        db
          .update(sessions)
          .set(updateData)
          .where(eq(sessions.id, session.id as string))
          .returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.notFound("Session", session.id as string));
        }
        return sessionToDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },
  };
}

// ========================================
// Replay Repository Port (Interface)
// ========================================

export interface ReplayRepository {
  findById(id: ReplayId): ResultAsync<Replay | null, AppError>;
  findBySessionId(sessionId: SessionId): ResultAsync<Replay | null, AppError>;
  findByUserId(userId: UserId): ResultAsync<readonly Replay[], AppError>;
  save(replay: Replay): ResultAsync<Replay, AppError>;
}

// ========================================
// Replay Repository Adapter (Implementation)
// ========================================

/**
 * Drizzle ORMを使用したReplayRepository実装
 */
export function createReplayRepository(db: Database): ReplayRepository {
  return {
    findById(id: ReplayId): ResultAsync<Replay | null, AppError> {
      return ResultAsync.fromPromise(
        db.query.replays.findFirst({
          where: eq(replays.id, id as string),
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((row) => {
        if (!row) return ok(null);
        return replayToDomain(row).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    findBySessionId(
      sessionId: SessionId,
    ): ResultAsync<Replay | null, AppError> {
      return ResultAsync.fromPromise(
        db.query.replays.findFirst({
          where: eq(replays.sessionId, sessionId as string),
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((row) => {
        if (!row) return ok(null);
        return replayToDomain(row).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    findByUserId(userId: UserId): ResultAsync<readonly Replay[], AppError> {
      // セッション経由でユーザーのリプレイを取得
      return ResultAsync.fromPromise(
        db
          .select()
          .from(replays)
          .innerJoin(sessions, eq(replays.sessionId, sessions.id))
          .where(eq(sessions.userId, userId as string))
          .orderBy(desc(replays.createdAt)),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Replay[] = [];
        for (const row of rows) {
          const result = replayToDomain(row.replays);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    save(replay: Replay): ResultAsync<Replay, AppError> {
      const row = replayToNewRow(replay);
      return ResultAsync.fromPromise(
        db.insert(replays).values(row).returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.database("write", "Failed to insert replay"));
        }
        return replayToDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },
  };
}
