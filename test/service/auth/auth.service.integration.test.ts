// Mock env before importing modules that depend on it
jest.mock("../../../src/env", () => ({
  env: {
    JWT_EXP: 3600,
    JWT_SECRET: "test-secret-key-for-integration-tests",
  },
}));

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { UserModel } from "../../../src/model/user.model";
import { env } from "../../../src/env";
import { login, renewToken } from "../../../src/services/auth.services";
import { IUserSchema } from "../../../src/types/user.types";
import { Role } from "../../../src/types/permission.types";

let mongoServer: MongoMemoryServer;
let testData: {
  users: {
    admin: mongoose.HydratedDocument<IUserSchema>;
    regular: mongoose.HydratedDocument<IUserSchema>;
  };
};

async function createTestData() {
  const adminUser = await UserModel.create({
    email: "admin@test.com",
    password: "adminpass",
    userName: "Simon",
    admin: true,
    verified: true,
    roles: [Role.ADMIN],
    permissions: [],
  });

  const regularUser = await UserModel.create({
    email: "user@test.com",
    password: "userpass",
    userName: "Pascal",
    admin: false,
    verified: true,
    roles: [Role.CONTENT_EDITOR],
    permissions: [],
  });

  return {
    users: { admin: adminUser, regular: regularUser },
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  testData = await createTestData();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("auth.service integration tests", () => {
  describe("login", () => {
    it("should create valid JWT token", async () => {
      const result = await login("adminpass", "admin@test.com");

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        const decoded = jwt.verify(result[0], env.JWT_SECRET) as jwt.JwtPayload;
        expect(decoded).toHaveProperty("sub");
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("roles");
      }
    });

    it("should create token with correct user data", async () => {
      const result = await login("adminpass", "admin@test.com");

      if (Array.isArray(result)) {
        const decoded = jwt.verify(result[0], env.JWT_SECRET) as jwt.JwtPayload;
        expect(decoded.sub).toBe(testData.users.admin._id.toString());
        expect(decoded.admin).toBe(testData.users.admin.admin);
      }
    });

    it("should create token with correct expiration time", async () => {
      const result = await login("adminpass", "admin@test.com");

      if (Array.isArray(result)) {
        const decoded = jwt.verify(result[0], env.JWT_SECRET) as jwt.JwtPayload;
        const expiresAt = decoded.exp ? decoded.exp : 0;
        // The token should expire roughly JWT_EXP seconds from now
        const now = Math.floor(Date.now() / 1000);
        expect(expiresAt).toBeGreaterThan(now);
        expect(expiresAt).toBeLessThanOrEqual(now + env.JWT_EXP + 1);
      }
    });
  });

  describe("renewToken", () => {
    it("should create valid renewed JWT token", async () => {
      const result = await renewToken(testData.users.admin._id.toString());

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && typeof result[0] === "string") {
        const decoded = jwt.verify(result[0], env.JWT_SECRET) as jwt.JwtPayload;
        expect(decoded).toHaveProperty('sub');
        expect(decoded.sub).toBe(testData.users.admin._id.toString());
        expect(typeof result[1]).toBe("number");
      }
    });
  });
});
