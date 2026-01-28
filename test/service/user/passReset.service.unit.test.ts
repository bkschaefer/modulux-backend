import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { UserModel } from "../../../src/model/user.model";
import { HttpError } from "../../../src/errors/HttpError";
import { sendEmail } from "../../../src/services/mail-services/sendMail";
import {
  changePassForgotten,
  checkPassResetToken,
  createPassReset,
} from "../../../src/services/user-services/passReset.services";
import { PassResetModel } from "../../../src/model/passReset.model";
import { MAILIDENTIFIER } from "../../../src/services/mail-services/mailIdentifer.enum";
import bcrypt from "bcryptjs";

jest.mock("jsonwebtoken");
jest.mock("../../../src/env", () => ({
  env: {
    JWT_EXP: 3600,
    JWT_SECRET: "test-secret",
    BREVO_API_USER: "7e7cc8001@smtp-brevo.com",
    BREVO_API_PASS: "9cIKa4NB82rxwJmy"

  },
}));

// Mocking der sendEmail Funktion, um zu verhindern, dass tatsächlich E-Mails gesendet werden
jest.mock("../../../src/services/mail-services/sendMail", () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: "test" }),
}));

let mongoServer: MongoMemoryServer;
let testUser: any;

// Funktion zum Erstellen eines Testbenutzers
async function createTestUser() {
  testUser = await UserModel.create({
    email: "testuser@example.com",
    password: "testpassword",
    userName: "TestUser",
    admin: false,
    verified: true,
  });
}

// Setup der Testumgebung vor allen Tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Setup vor jedem Test: Datenbank wird gelöscht und ein neuer Testbenutzer erstellt
beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await createTestUser();
});

// Aufräumen nach allen Tests: Verbindung wird getrennt und der MongoMemoryServer gestoppt
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Testgruppe: Password Reset Service - createPassReset
describe("Password Reset Service - createPassReset", () => {
  test("sollte einen Passwort-Reset-Eintrag erstellen und eine E-Mail senden", async () => {
    const resetResource = await createPassReset(testUser.userName);

    // Überprüfen, ob das Reset-Objekt korrekt erstellt wurde
    expect(resetResource!.userID).toBe(testUser.id);
    expect(resetResource!.isUsed).toBeFalsy();
    expect(resetResource!.resetToken).toHaveLength(36);
    expect(resetResource!.expireDate).toBeTruthy();

    // Überprüfen, ob die E-Mail gesendet wurde
    expect(sendEmail).toHaveBeenCalledWith({
      mailIdentifier: MAILIDENTIFIER.RESETPASSMAIL,
      reciverEmail: testUser.email,
      resetToken: resetResource!.resetToken,
    });
  });

  test("sollte einen Fehler werfen, wenn der Benutzer nicht existiert", async () => {
    await expect(createPassReset("nonexistentUser")).rejects.toThrow(HttpError);
  });
});

// Testgruppe: Password Reset Service - checkPassResetToken
describe("Password Reset Service - checkPassResetToken", () => {
  beforeEach(async () => {
    await PassResetModel.deleteMany({});
  });

  test("sollte ein gültiges Reset-Token bestätigen", async () => {
    const resetResource = await createPassReset(testUser.userName);
    const isValid = await checkPassResetToken(resetResource!.resetToken);
    expect(isValid).toBe(true);
  });

  test("sollte einen Fehler werfen, wenn das Reset-Token abgelaufen ist", async () => {
    const resetResource = await createPassReset(testUser.userName);
    await PassResetModel.updateOne(
      { resetToken: resetResource!.resetToken },
      { expireDate: new Date(Date.now() - 86400000) },
    );

    await expect(
      checkPassResetToken(resetResource!.resetToken),
    ).rejects.toThrow(HttpError);
  });

  test("sollte einen Fehler werfen, wenn das Reset-Token bereits verwendet wurde", async () => {
    const resetResource = await createPassReset(testUser.userName);
    await PassResetModel.updateOne(
      { resetToken: resetResource!.resetToken },
      { isUsed: true },
    );

    await expect(
      checkPassResetToken(resetResource!.resetToken),
    ).rejects.toThrow(HttpError);
  });
});

// Testgruppe: Password Reset Service - changePassForgotten
describe("Password Reset Service - changePassForgotten", () => {
  beforeEach(async () => {
    await PassResetModel.deleteMany({});
  });
  test("sollte das Passwort für ein gültiges Reset-Token ändern", async () => {
    const resetResource = await createPassReset(testUser.userName);
    const newPassword = "123_abc_ABC";
    await changePassForgotten(resetResource!.resetToken, newPassword);

    const updatedUser = await UserModel.findById(testUser.id);
    // Vergleiche das neue Passwort mit dem gehashten Wert
    const isPasswordCorrect = await bcrypt.compare(
      newPassword,
      updatedUser!.password,
    );

    expect(isPasswordCorrect).toBe(true);
  });

  test("sollte einen Fehler werfen, wenn das Reset-Token ungültig oder abgelaufen ist", async () => {
    const resetResource = await createPassReset(testUser.userName);
    await PassResetModel.updateOne(
      { resetToken: resetResource!.resetToken },
      { expireDate: new Date(Date.now() - 86400000) },
    );

    await expect(
      changePassForgotten(resetResource!.resetToken, "123_abc_ABC"),
    ).rejects.toThrow(HttpError);
  });

  test("sollte einen Fehler werfen, wenn der Benutzer nicht gefunden werden kann", async () => {
    const resetResource = await createPassReset(testUser.userName);
    await UserModel.deleteOne({ _id: testUser.id });

    await expect(
      changePassForgotten(resetResource!.resetToken, "123_abc_ABC"),
    ).rejects.toThrow(HttpError);
  });

  test("sollte einen Fehler werfen, wenn Passwort nicht strong", async () => {
    //ToDO: Notwendigkeit? Frontend validierung
  });
});
