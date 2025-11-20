const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "index.web.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.[contenthash].js",
    publicPath: "/"
  },
  resolve: {
    // Mise à jour : on garde les extensions web-first et on priorise .tsx/.ts
    extensions: [".web.js", ".web.ts", ".web.tsx", ".tsx", ".ts", ".js", ".jsx", ".json"],
    alias: {
      "react-native$": "react-native-web",
      // Forcer l'usage du shim local si abitype pose problème
      "abitype": path.resolve(__dirname, "abitype-shim.js"),
      // Shims pour modules natifs introuvables côté web
      "react-native-keychain": path.resolve(__dirname, "src/shims/react-native-keychain.js"),
      "@react-native-vector-icons/material-design-icons": path.resolve(__dirname, "src/shims/material-design-icons.js")
    },
    fallback: {
      // Polyfills pour modules Node core utilisés par certaines dépendances
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      assert: require.resolve("assert"),
      zlib: require.resolve("browserify-zlib"),
      util: require.resolve("util/"),
      buffer: require.resolve("buffer/"),
      process: require.resolve("process/browser"),
      path: require.resolve("path-browserify"),
      // fs n'existe pas dans le navigateur — on le marque false
      fs: false
    }
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules\/(?!(react-native-vector-icons)\/).*/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: { browsers: "last 2 versions" } }],
              "@babel/preset-react",
              "@babel/preset-typescript"
            ],
            plugins: []
          }
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(ttf|otf|eot|woff|woff2)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/fonts/[name][ext]"
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: "asset/resource",
        generator: {
          filename: "assets/images/[name][ext]"
        }
      },
      {
        test: /\.wasm$/i,
        type: "webassembly/async"
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public", "index.html"),
      inject: "body"
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    }),
    new NodePolyfillPlugin()
  ],
  // Activation WebAssembly async requis pour argon2-browser.wasm
  experiments: {
    asyncWebAssembly: true
  },
  devServer: {
    static: path.resolve(__dirname, "public"),
    compress: true,
    port: 8080,
    historyApiFallback: true
  }
};