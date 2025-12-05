module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [ 
    'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@data': './src/data',
        },
      },
    ],
  ],
};
