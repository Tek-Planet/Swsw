module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation)/)',
  ],
  verbose: true,
  setupFiles: ['./jest.setup.js'],
  modulePaths: ['<rootDir>/src'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$_': '<rootDir>/src/__mocks__/fileMock.js',
    '@react-native-vector-icons/ionicons': '<rootDir>/src/__mocks__/@react-native-vector-icons/ionicons.js',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$_m',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageReporters: ['json', 'lcov'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
  roots: ['<rootDir>/src'],
};
