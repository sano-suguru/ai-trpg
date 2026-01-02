/**
 * シードスクリプト
 *
 * サンプルキャラクターとダンジョンデータをDBに投入する
 * 冪等性あり（既存データがあればスキップ）
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { characters, dungeons } from "../infrastructure/database/schema";
import { sampleCharacters, SEED_OWNER_ID } from "./data/characters";
import { sampleDungeons } from "./data/dungeons";

// Supabase Local用の接続文字列
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function seed() {
  console.log("🌱 シードデータの投入を開始します...\n");
  console.log("接続先:", connectionString);

  const sql = postgres(connectionString);
  const db = drizzle({ client: sql });

  try {
    // 既存のシードデータを確認
    const existingCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.ownerId, SEED_OWNER_ID));

    const existingDungeons = await db
      .select()
      .from(dungeons)
      .where(eq(dungeons.authorId, SEED_OWNER_ID));

    // キャラクターの投入
    console.log("📝 キャラクターデータを確認中...");
    if (existingCharacters.length > 0) {
      console.log(
        `  ⏭️  既存のシードキャラクター(${existingCharacters.length}件)が見つかりました。スキップします。`,
      );
    } else {
      console.log(
        `  ➕ ${sampleCharacters.length}件のキャラクターを投入します...`,
      );
      await db.insert(characters).values(sampleCharacters);
      console.log("  ✅ キャラクターの投入が完了しました。");
    }

    // ダンジョンの投入
    console.log("\n🏰 ダンジョンデータを確認中...");
    if (existingDungeons.length > 0) {
      console.log(
        `  ⏭️  既存のシードダンジョン(${existingDungeons.length}件)が見つかりました。スキップします。`,
      );
    } else {
      console.log(`  ➕ ${sampleDungeons.length}件のダンジョンを投入します...`);
      await db.insert(dungeons).values(sampleDungeons);
      console.log("  ✅ ダンジョンの投入が完了しました。");
    }

    console.log("\n🎉 シードデータの投入が完了しました！");
    console.log("\n投入されたデータ:");
    console.log(`  - キャラクター: ${sampleCharacters.length}件`);
    console.log(`  - ダンジョン: ${sampleDungeons.length}件`);
  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    await sql.end();
    process.exit(1);
  }

  // 正常終了
  await sql.end();
  process.exit(0);
}

// スクリプト実行
seed();
