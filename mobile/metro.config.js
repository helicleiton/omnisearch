// O app importa a lógica pura de backend/src/core (validação, máscaras e fontes
// abertas) para funcionar sem servidor. O Metro precisa observar essa pasta.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../backend/src')];

module.exports = config;
