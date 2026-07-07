import { beforeAll, afterAll } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"

let mongod: MongoMemoryServer

process.env.MONGODB_URI = "mongodb://localhost:27017/sabari-test"
process.env.JWT_SECRET = "test-jwt-secret"
process.env.JWT_EXPIRES_IN = "7d"

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  process.env.MONGODB_URI = uri
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})
