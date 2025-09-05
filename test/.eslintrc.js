module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  globals: {
    describe: true,
    it: true,
    expect: true,
    vi: true,
  },
  rules: {
    "no-unused-vars": 0,
  },
};
