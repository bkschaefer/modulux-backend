import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "../../../src/env";
import mongoose from "mongoose";
import { UserModel } from "../../../src/model/user.model";
import {
  createInvite,
  invalidateInvite,
  verifyInvite,
} from "../../../src/services/user-services/registration.services";
import { InviteModel } from "../../../src/model/invite.model";
import { HttpError400, HttpError } from "../../../src/errors/HttpError";

jest.mock("jsonwebtoken");
jest.mock("../../../src/env", () => ({
  env: {
    JWT_EXP: 3600,
    JWT_SECRET: "test-secret",
  },
}));

let adminUser;

async function createTestData() {
  adminUser = await UserModel.create({
    email: "admin2@test.com",
    password: "adminpass",
    userName: "Simon",
    admin: true,
    verified: true,
  });
}

let mongoServer: MongoMemoryServer;

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

describe("Tests zur Regestrierungs service - Invite anlegen", () => {
  test("invite anlegen", async () => {
    //hier Testemail angeben
    const testEmail = "test@email.de";
    const inviteResource = await createInvite(testEmail, adminUser!.userName);

    //richtige Ressource wird zurück gegeben
    expect(inviteResource.email).toBe(testEmail);
    expect(inviteResource.isUsed).toBeFalsy();
    expect(inviteResource.inviteToken).toHaveLength(36);
    expect(inviteResource.expireDate).toBeTruthy();

    //Invite exestiert in Datenbank
    const inviteFromData = await InviteModel.findOne({
      email: inviteResource.email,
      isUsed: inviteResource.isUsed,
      expireDate: inviteResource.expireDate,
      inviteToken: inviteResource.inviteToken,
    });
    expect(inviteFromData).toBeTruthy;
  });

  test("zu viele Invites auf eine adresse", async () => {
    //Idee: vlt noch testen bei zu vielen Emails auf eine Adresse, das
  });
});

describe("Tests zur Regestrierungs service - Invite verifizieren", () => {
  test("invite verifizieren, wenn korrekt benutzt", async () => {
    const testEmail = "test@email.de";
    const inviteResource = await createInvite(testEmail, adminUser!.userName);

    //es wird kein error geworfen
    const inviteVerifyInvite = await verifyInvite(inviteResource.inviteToken);

    //richtige Ressource wird zurück gegeben
    expect(inviteVerifyInvite.email).toBe(testEmail);
    expect(inviteVerifyInvite.isUsed).toBeFalsy();
    expect(inviteVerifyInvite.inviteToken).toHaveLength(36);
    expect(inviteVerifyInvite.expireDate).toBeTruthy();
  });

  test("invite verifizieren, wenn Token bereits benutzt wurde", async () => {
    const testEmail = "testused@email.de";
    const inviteResource = await createInvite(testEmail, adminUser!.userName);

    await invalidateInvite(inviteResource.inviteToken);

    await expect(verifyInvite(inviteResource.inviteToken)).rejects.toThrow(
      HttpError,
    );
  });

  test("invite verifizieren, wenn Token abgelaufen ist", async () => {
    const testEmail = "testexpired@email.de";
    const inviteResource = await createInvite(testEmail, adminUser!.userName);

    // Setze ein abgelaufenes Datum
    await InviteModel.updateOne(
      { inviteToken: inviteResource.inviteToken },
      { expireDate: new Date(Date.now() - 86400000) },
    );

    await expect(verifyInvite(inviteResource.inviteToken)).rejects.toThrow(
      HttpError,
    );
  });

  test("invite verifizieren, wenn Token nicht existiert", async () => {
    const nonExistentToken = "non-existent-token";
    await expect(verifyInvite(nonExistentToken)).rejects.toThrow(HttpError);
  });
});
