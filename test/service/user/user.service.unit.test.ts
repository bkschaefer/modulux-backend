import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "../../../src/env";
import mongoose from "mongoose";
import { UserModel } from "../../../src/model/user.model";
import { HttpError400, HttpError } from "../../../src/errors/HttpError";
import {
  changePassword,
  createFirstUser,
  createUser,
  deleteUser,
  getUser,
  queryUser,
  updateUser,
} from "../../../src/services/user-services/user.services";
import bcrypt from "bcryptjs";

jest.mock("jsonwebtoken");
jest.mock("../../../src/env", () => ({
  env: {
    JWT_EXP: 3600,
    JWT_SECRET: "test-secret",
  },
}));

let mongoServer: MongoMemoryServer;
let adminUser: any;

async function createTestData() {
  adminUser = await createFirstUser({
    password: "adminpass",
    email: "admin@test.com",
    userName: "AdminUser",
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await createTestData();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

//muss raus genommen werden für reelle tests
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test" }),
  }),
}));

describe("UserService Tests", () => {
  test("Create a new user", async () => {
    const newUser = await createUser({
      password: "testpass",
      email: "newuser@test.com",
      admin: false,
      userName: "NewUser",
    });

    expect(newUser.email).toBe("newuser@test.com");
    expect(newUser.userName).toBe("NewUser");
    expect(newUser.admin).toBeFalsy();
    expect(newUser.verified).toBeFalsy();

    const createdUser = await UserModel.findOne({ email: "newuser@test.com" });
    expect(createdUser).toBeTruthy();
    expect(createdUser!.userName).toBe("NewUser");
  });

  test("Fail to create user with existing email", async () => {
    await expect(
      createUser({
        email: "admin@test.com",
        password: "anotherpass",
        userName: "AnotherUser",
        admin: false,
      }),
    ).rejects.toThrow(HttpError400);
  });

  test("Fetch an existing user by ID", async () => {
    let myAdminUser = await UserModel.findOne({ userName: adminUser.userName });
    const fetchedUser = await getUser(myAdminUser!.id);
    expect(fetchedUser.email).toBe("admin@test.com");
    expect(fetchedUser.userName).toBe("AdminUser");
  });

  test("Fail to fetch a user with an invalid ID", async () => {
    const invalidId = new mongoose.Types.ObjectId().toString();
    await expect(getUser(invalidId)).rejects.toThrow(HttpError);
  });

  test("should return user details when valid query is provided", async () => {
    const query = { userName: adminUser.userName };

    const result = await queryUser(query);

    expect(result).toBeTruthy();
    expect(result.userName).toBe(adminUser.userName);
    expect(result.email).toBe(adminUser.email);
    expect(result.verified).toBe(adminUser.verified);
    expect(result.admin).toBe(adminUser.admin);
  });

  test("Update user username and email", async () => {
    let myAdminUser = await UserModel.findOne({ userName: adminUser.userName });
    const updatedUser = await updateUser(
      myAdminUser!.id,
      "UpdatedAdmin",
      "updated@test.com",
    );

    expect(updatedUser.userName).toBe("UpdatedAdmin");
    expect(updatedUser.email).toBe("updated@test.com");

    const fetchedUser = await UserModel.findById(myAdminUser!.id);
    expect(fetchedUser!.userName).toBe("UpdatedAdmin");
    expect(fetchedUser!.email).toBe("updated@test.com");
  });

  test("Fail to update a non-existent user", async () => {
    const invalidId = new mongoose.Types.ObjectId().toString();
    await expect(updateUser(invalidId, "NewName")).rejects.toThrow(HttpError);
  });

  test("change user password", async () => {
    let myAdminUser = await UserModel.findOne({ userName: adminUser.userName });
    const newPass = "HokusPokus123$";
    await changePassword(myAdminUser!.id, newPass, "adminpass");

    const updatedUser = await UserModel.findOne({
      userName: adminUser.userName,
    });
    const isPasswordCorrect = await bcrypt.compare(
      newPass,
      updatedUser!.password,
    );
    expect(isPasswordCorrect).toBe(true);
  });

  test("change user password, old password not correct", async () => {
    let myAdminUser = await UserModel.findOne({ userName: adminUser.userName });
    const newPass = "HokusPokus123$";
    expect(changePassword(myAdminUser!.id, newPass, "lalala")).rejects.toThrow(
      HttpError,
    );
  });

  test("Delete a non-admin user", async () => {
    const newUser = await createUser({
      email: "delete@test.com",
      password: "testpass",
      userName: "DeleteUser",
      admin: false,
    });

    const deletedUser = await deleteUser(newUser.id);
    expect(deletedUser.email).toBe("delete@test.com");

    const fetchedUser = await UserModel.findById(newUser.id);
    expect(fetchedUser).toBeNull();
  });

  test("Fail to delete an admin user", async () => {
    let myAdminUser = await UserModel.findOne({ userName: adminUser.userName });
    await expect(deleteUser(myAdminUser!.id)).rejects.toThrow(HttpError);
  });
});
