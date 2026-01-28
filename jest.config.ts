import type { Config } from "jest";

const config: Config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**/*.test.ts"],
  testTimeout: 10000,
  setupFiles: ["<rootDir>/test/setup.ts"],
};


export default config;
