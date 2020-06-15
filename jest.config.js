module.exports = {
  roots: ["<rootDir>/src", "<rootDir>/test"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  verbose: true,
  testTimeout: 60000,
  name: require("./package.json").name,
  displayName: require("./package.json").name,
};
