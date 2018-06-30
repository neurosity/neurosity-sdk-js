import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  input: "dist/esm/index.js",
  output: {
    file: "dist/esm/notion.mjs",
    format: "es",
    name: "Notion"
  },
  plugins: [
    resolve({
      module: true,
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
