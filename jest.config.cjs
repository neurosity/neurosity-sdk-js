/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 30,
      statements: 30
    }
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
        tsconfig: {
          target: "es2020"
        },
        diagnostics: {
          ignoreCodes: [
            2345, // Argument type not assignable
            2322, // Type not assignable
            2531, // Object is possibly null
            2532, // Object is possibly undefined
            7053 // Element implicitly has any type
          ]
        }
      }
    ]
  }
};
