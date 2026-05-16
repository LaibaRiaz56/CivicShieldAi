module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // expo-router/babel removed — we use standard App.tsx with React Navigation
  };
};
