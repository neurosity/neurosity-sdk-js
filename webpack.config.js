const path = require("path");
const nodeExternals = require("webpack-node-externals");

const library = "HeadwearAPI";
const libraryTarget = "umd";

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    library,
    libraryTarget,
    globalObject: "this"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  //externals: [nodeExternals({})],
  devtool: "eval",
  devServer: {
    compress: true,
    port: 9000
  }
};
