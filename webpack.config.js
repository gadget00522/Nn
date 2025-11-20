const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

// Liste de tous les mots-clés qui doivent être compilés
// Si un fichier contient un de ces mots, il passera par Babel.
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
];

const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  // C'EST ICI LA CORRECTION MAJEURE
  // Au lieu d'une liste de chemins, on utilise une fonction intelligente
  include: (input) => {
    // 1. Toujours compiler les fichiers du projet (hors node_modules)
    if (!input.includes('node_modules')) {
      return true;
    }
    // 2. Compiler les fichiers node_modules qui sont dans notre liste blanche
    return compileNodeModules.some((moduleName) => input.includes(moduleName));
  },
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
        '@babel/preset-flow', // Important pour certains modules Expo
      ],
      plugins: [
        ['react-native-web', { commonjs: true }],
        '@babel/plugin-proposal-export-namespace-from',
        // On ajoute ce plugin pour gérer les propriétés de classe dans les vieilles libs
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-proposal-private-methods', { loose: true }],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
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
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.jsx', '.web.jsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-keychain': path.resolve(appDirectory, 'keychain.mock.js'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      {
        test: /\.(jpg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      },
      // Règle spéciale pour forcer le chargement des polices d'icônes
      {
        test: /\.ttf$/,
        loader: 'url-loader', 
        include: path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public/index.html'),
    }),
  ],
};


