/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
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
