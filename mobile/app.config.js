// Estende o app.json. EXPO_BASE_URL define o subcaminho da versão web
// (ex.: "/omnisearch" no GitHub Pages); vazio no desenvolvimento local.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
