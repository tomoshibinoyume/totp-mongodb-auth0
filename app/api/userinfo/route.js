import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
    }
    const client = await getMongoClient();
    // 例: 複数DBを調べるならDB一覧取得
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();

    const excluded = ["admin", "local", "config"];
    const filteredDbNames = dbs.databases
      .map((db) => db.name)
      .filter((name) => !excluded.includes(name));

    const userDbs = [];
    // 各DBに接続してuser_dataコレクションにuserIdがあるかチェック
    for (const dbName of filteredDbNames) {
      const db = client.db(dbName);
      const collection = db.collection("user_data");

      // userIdが存在するか調べる（1件だけチェック）
      const userDoc = await collection.findOne({ userId: userId });
      if (userDoc) {
        userDbs.push(dbName);
      }
    }

    return NextResponse.json(userDbs);
  } catch (error) {
    console.error("Error fetching user databases:", error);
    return NextResponse.json({ error: "Failed to fetch user databases" }, { status: 500 });
  }
}
