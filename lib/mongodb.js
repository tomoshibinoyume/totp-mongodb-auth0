// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) throw new Error("MONGODB_URI is not defined");
if (!dbName) throw new Error("MONGODB_DB is not defined");

// グローバルにキャッシュ（開発時の再接続防止）
let client;
let clientPromise;

if (!global._mongoClient) {
  client = new MongoClient(uri);
  global._mongoClient = client.connect();
}
clientPromise = global._mongoClient;

export async function getMongoDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export async function getMongoClient() {
  return await clientPromise;
}


// import { MongoClient } from 'mongodb';
//
// const uri = process.env.MONGODB_URI;
// const dbName = process.env.MONGODB_DB;
//
// if (!uri) throw new Error("MONGODB_URI is not defined");
// if (!dbName) throw new Error("MONGODB_DB is not defined");
//
// let client = new MongoClient(uri);
// let clientPromise = client.connect();
//
// // DBオブジェクトを返す（通常のDB操作用）
// export async function getMongoDb() {
//   const connectedClient = await clientPromise;
//   return connectedClient.db(dbName);
// }
//
// // MongoClientインスタンスを返す（管理者コマンド用）
// export async function getMongoClient() {
//   return await clientPromise;
// }
