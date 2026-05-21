/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        target: "ES2022",
        module: "Node16",
        moduleResolution: "Node16",
        esModuleInterop: true,
        strict: true,
        resolveJsonModule: true,
        isolatedModules: true
      },
      diagnostics: {
        ignoreCodes: [151002]
      }
    }]
  },
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/cli/**"],
  coverageDirectory: "coverage"
};

module.exports = config;
