// Mock jsonwebtoken before importing it
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mocked-token"),
  verify: jest.fn(),
}));

jest.mock("../../../src/env", () => ({
  env: {
    JWT_EXP: 3600,
    JWT_SECRET: "test-secret",
  },
}));

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import * as jwt from "jsonwebtoken";
import { UserModel } from "../../../src/model/user.model";
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

describe("auth.service unit tests", () => {
  describe("login", () => {
    beforeEach(() => {
      (jwt.sign as jest.Mock).mockReturnValue("mocked-token");
    });

    it("should return token array for valid credentials", async () => {
      const result = await login("adminpass", "admin@test.com");

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0]).toBe("mocked-token");
      }
    });

    it("should return false for invalid credentials", async () => {
      const result = await login("admin@test.com", "wrongpass");
      expect(result).toBe(false);
    });
  });

  describe("renewToken", () => {
    it("should renew token for valid user", async () => {
      (jwt.sign as jest.Mock).mockReturnValue("new-mocked-token");
      const result = await renewToken(testData.users.admin._id.toString());

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0]).toBe("new-mocked-token");
        expect(typeof result[1]).toBe("number");
      }
    });

    it("should return false for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await renewToken(nonExistentId);
      expect(result).toBe(false);
    });
  });
});
