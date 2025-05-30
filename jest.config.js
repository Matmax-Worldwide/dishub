// jest.config.js
const nextJest = require('next/jest')({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: if you have a setup file for global setup
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured by next/jest)
    // Example: '^@/components/(.*)$': '<rootDir>/components/$1',
    // Next/jest handles this automatically for `@/` based on tsconfig.json paths
    // If you have other aliases, add them here.
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true, // Explicitly enable coverage collection
  collectCoverageFrom: [
    // --- Booking Module Specific ---
    "src/app/[locale]/cms/calendar/**/*.{ts,tsx}",
    "!src/app/[locale]/cms/calendar/**/*.test.{ts,tsx}",
    "src/components/cms/calendar/**/*.{ts,tsx}",
    "!src/components/cms/calendar/**/*.test.{ts,tsx}",
    "src/components/cms/sections/CalendarSection.tsx",
    "!src/components/cms/sections/CalendarSection.test.tsx",
    "src/app/api/graphql/resolvers/calendarResolvers.ts",
    // Potentially add other specific booking resolver files if they exist
    // e.g., "src/app/api/graphql/resolvers/bookingResolvers.ts", 
    // --- End Booking Module Specific ---

    // General exclusions
    "!src/types/**/*", // Exclude all type definition files
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.js", // Exclude this config file itself
    "!next.config.mjs", // Exclude next config
    "!postcss.config.mjs",
    "!tailwind.config.mjs",
    "!middleware.ts", // Exclude middleware file if not testable or not desired in coverage
    "!src/app/i18n/**", // Exclude i18n setup
    "!src/app/layout.tsx", // Exclude root layout
    "!src/app/[locale]/layout.tsx", // Exclude locale layout
    "!src/lib/apollo-client.ts", // Exclude library/config files if not testable
    // Add any other files/patterns to exclude from coverage
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  // coverageThreshold: { // Optional: to enforce coverage minimums
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10, // Example: 10 fewer statements than lines
  //   },
  // },
  testPathIgnorePatterns: [ // To ignore e2e tests or other non-unit tests if any
    "<rootDir>/node_modules/", 
    "<rootDir>/.next/",
    // "<rootDir>/tests-e2e/" 
  ],
  // If using SWC for transpilation (Next.js default), transform might not be needed explicitly.
  // If using Babel with ts-jest, it might look like:
  // transform: {
  //   '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  // },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = nextJest(customJestConfig);
