const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(appDirectory, 'node_modules/@expo/vector-icons'),
    path.resolve(appDirectory, 'node_modules/expo-asset'),
    path.resolve(appDirectory, 'node_modules/expo-font'),
    path.resolve(appDirectory, 'node_modules/expo-modules-core'),
    path.resolve(appDirectory, 'node_modules/@react-native'),
    path.resolve(appDirectory, 'node_modules/react-native-paper'),
    path.resolve(appDirectory, 'node_modules/react-native-safe-area-context'),
    path.resolve(appDirectory, 'node_modules/react-native-toast-message'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      babelrc: false,
      configFile: false,
      presets: [
        ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
        '@babel/preset-react',
        '@babel/preset-typescript',
        '@babel/preset-flow',
      ],
      plugins: [
        ['react-native-web', { commonjs: true }],
        '@babel/plugin-proposal-export-namespace-from',
      ],
    },
  },
};

module.exports = {
  entry: {
    app: path.join(appDirectory, 'index.web.js'),
  },
  output: {
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
    filename: 'bundle.web.js',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
    alias: {
      'react-native$': 'react-native-web',
      // C'EST ICI LA MAGIE : On remplace le Keychain par notre mock
      'react-native-keychain': path.resolve(appDirectory, 'keychain.mock.js'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public/index.html'),
    }),
  ],
};


