const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);

const compileNodeModules = [
  'react-native',
  '@react-native',
  '@expo',
  'expo',
  'nativewind',
  'react-native-paper',
  'react-native-vector-icons',
  'react-native-safe-area-context',
  'react-native-svg',
  'react-native-qrcode-svg',
  'react-native-toast-message',
  'react-native-screens',
  '@react-navigation',
  'alchemy-sdk',
  'firebase'
];

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: (input) => {
    if (!input.includes('node_modules')) return true;
    return compileNodeModules.some(m => input.includes(m));
  },
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      babelrc: false,
      configFile: false,
      presets: ['module:metro-react-native-babel-preset'],
      plugins: [
        ['react-native-web', { commonjs: true }],
      ],
    },
  },
};

module.exports = {
  entry: { app: path.join(appDirectory, 'index.web.js') },
  output: {
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
    filename: 'bundle.web.js',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.jsx', '.web.jsx'],
    alias: {
      'react-native$': 'react-native-web',
      // 'abitype': path.resolve(appDirectory, 'abitype-shim.js'), // Active seulement si nécessaire
    },
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
    }
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      { test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/, type: 'asset/resource' },
      {
        test: /\.ttf$/,
        loader: 'url-loader',
        include: path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.join(appDirectory, 'public/index.html') }),
    new webpack.ProvidePlugin({ process: 'process/browser', Buffer: ['buffer', 'Buffer'] }),
    new webpack.DefinePlugin({ __DEV__: JSON.stringify(false), global: 'globalThis' })
  ],
  stats: { errorDetails: true }
};