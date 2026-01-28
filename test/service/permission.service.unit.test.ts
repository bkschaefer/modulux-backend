import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { UserModel } from "../../src/model/user.model";
import { assignRoles } from "../../src/services/user-services/user.services";
import { IUserSchema } from "../../src/types/user.types";
import { Role } from "../../src/types/permission.types";

let mongoServer: MongoMemoryServer;
let testData: {
  users: {
    admin: mongoose.HydratedDocument<IUserSchema>;
    userManager: mongoose.HydratedDocument<IUserSchema>;
    contentEditor: mongoose.HydratedDocument<IUserSchema>;
    regular: mongoose.HydratedDocument<IUserSchema>;
  };
};

async function createTestData() {
  const adminUser = await UserModel.create({
    email: "admin@test.com",
    password: "adminpass",
    userName: "Simon",
    roles: [Role.ADMIN],
  });

  const userManagerUser = await UserModel.create({
    email: "usermanager@test.com",
    password: "managerpass",
    userName: "John",
    roles: [Role.USER_MANAGER],
  });

  const contentEditorUser = await UserModel.create({
    email: "editor@test.com",
    password: "editorpass",
    userName: "Jane",
    roles: [Role.CONTENT_EDITOR],
  });

  const regularUser = await UserModel.create({
    email: "user@test.com",
    password: "userpass",
    userName: "Pascal",
    roles: [],
  });

  return {
    users: { 
      admin: adminUser, 
      userManager: userManagerUser,
      contentEditor: contentEditorUser,
      regular: regularUser 
    },
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

describe("permission.service unit tests", () => {
  describe("assignRole", () => {
    it("should assign a new role to user", async () => {
      const result = await assignRoles(
        testData.users.regular._id.toString(),
        [Role.CONTENT_EDITOR]
      );

      expect(result.roles).toContain(Role.CONTENT_EDITOR);
      expect(result.roles.length).toBe(1);
    });

    it("should not duplicate existing role", async () => {
      const result = await assignRoles(
        testData.users.contentEditor._id.toString(),
        [Role.CONTENT_EDITOR]
      );

      expect(result.roles).toContain(Role.CONTENT_EDITOR);
      expect(result.roles.length).toBe(1);
    });

    it("should allow multiple roles for the same user", async () => {
      await assignRoles(
        testData.users.regular._id.toString(),
        [Role.CONTENT_EDITOR]
      );

      const result = await assignRoles(
        testData.users.regular._id.toString(),
        [Role.SCHEMA_EDITOR, Role.USER_MANAGER]
      );
      expect(result.roles).not.toContain(Role.CONTENT_EDITOR);
      expect(result.roles).toContain(Role.SCHEMA_EDITOR);
      expect(result.roles).toContain(Role.USER_MANAGER);
      expect(result.roles.length).toBe(2);
    });

    it("should throw error for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(
        assignRoles(nonExistentId, [Role.CONTENT_EDITOR])
      ).rejects.toThrow("User not found");
    });
  });
});