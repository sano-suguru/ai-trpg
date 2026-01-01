/**
 * Dungeon Repository
 *
 * ダンジョンの永続化を担当
 * Port（インターフェース）とAdapter（実装）を同一ファイルに定義
 */

import { ResultAsync, ok, err } from "neverthrow";
import { eq, sql } from "drizzle-orm";
import { Dungeon, DungeonId, UserId } from "@ai-trpg/shared/domain";
import { Errors, AppError } from "@ai-trpg/shared/types";
import type { Database } from "../../infrastructure/database/client";
import { dungeons } from "../../infrastructure/database/schema";
import { toDomain, toNewRow, toUpdateRow } from "./mapper";

// ========================================
// Port (Interface)
// ========================================

export interface DungeonRepository {
  findById(id: DungeonId): ResultAsync<Dungeon | null, AppError>;
  findByAuthorId(authorId: UserId): ResultAsync<readonly Dungeon[], AppError>;
  findPublic(): ResultAsync<readonly Dungeon[], AppError>;
  save(dungeon: Dungeon): ResultAsync<Dungeon, AppError>;
  update(dungeon: Dungeon): ResultAsync<Dungeon, AppError>;
  delete(id: DungeonId): ResultAsync<void, AppError>;
  incrementPlayCount(id: DungeonId): ResultAsync<void, AppError>;
}

// ========================================
// Adapter (Implementation)
// ========================================

/**
 * Drizzle ORMを使用したDungeonRepository実装
 */
export function createDungeonRepository(db: Database): DungeonRepository {
  return {
    findById(id: DungeonId): ResultAsync<Dungeon | null, AppError> {
      return ResultAsync.fromPromise(
        db.query.dungeons.findFirst({
          where: eq(dungeons.id, id as string),
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((row) => {
        if (!row) return ok(null);
        return toDomain(row).mapErr((e) => Errors.database("read", e.message));
      });
    },

    findByAuthorId(
      authorId: UserId,
    ): ResultAsync<readonly Dungeon[], AppError> {
      return ResultAsync.fromPromise(
        db.query.dungeons.findMany({
          where: eq(dungeons.authorId, authorId as string),
          orderBy: (dungeons, { desc }) => [desc(dungeons.updatedAt)],
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Dungeon[] = [];
        for (const row of rows) {
          const result = toDomain(row);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    findPublic(): ResultAsync<readonly Dungeon[], AppError> {
      return ResultAsync.fromPromise(
        db.query.dungeons.findMany({
          where: eq(dungeons.isPublic, true),
          orderBy: (dungeons, { desc }) => [desc(dungeons.playCount)],
        }),
        (e: unknown) => Errors.database("read", String(e)),
      ).andThen((rows) => {
        const results: Dungeon[] = [];
        for (const row of rows) {
          const result = toDomain(row);
          if (result.isErr()) {
            return err(Errors.database("read", result.error.message));
          }
          results.push(result.value);
        }
        return ok(results);
      });
    },

    save(dungeon: Dungeon): ResultAsync<Dungeon, AppError> {
      const row = toNewRow(dungeon);
      return ResultAsync.fromPromise(
        db.insert(dungeons).values(row).returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.database("write", "Failed to insert dungeon"));
        }
        return toDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    update(dungeon: Dungeon): ResultAsync<Dungeon, AppError> {
      const updateData = toUpdateRow(dungeon);
      return ResultAsync.fromPromise(
        db
          .update(dungeons)
          .set(updateData)
          .where(eq(dungeons.id, dungeon.id as string))
          .returning(),
        (e: unknown) => Errors.database("write", String(e)),
      ).andThen((rows) => {
        if (rows.length === 0) {
          return err(Errors.notFound("Dungeon", dungeon.id as string));
        }
        return toDomain(rows[0]).mapErr((e) =>
          Errors.database("read", e.message),
        );
      });
    },

    delete(id: DungeonId): ResultAsync<void, AppError> {
      return ResultAsync.fromPromise(
        db.delete(dungeons).where(eq(dungeons.id, id as string)),
        (e: unknown) => Errors.database("delete", String(e)),
      ).map(() => undefined);
    },

    incrementPlayCount(id: DungeonId): ResultAsync<void, AppError> {
      return ResultAsync.fromPromise(
        db
          .update(dungeons)
          .set({
            playCount: sql`${dungeons.playCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(dungeons.id, id as string)),
        (e: unknown) => Errors.database("write", String(e)),
      ).map(() => undefined);
    },
  };
}
