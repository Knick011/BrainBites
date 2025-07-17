module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // React Native Reanimated plugin should be last
    'react-native-reanimated/plugin',
    // Module resolver for path aliases
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@styles': './src/styles',
          '@types': './src/types',
          '@assets': './src/assets',
          '@config': './src/config',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
