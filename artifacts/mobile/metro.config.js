const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.blockList = [
  /.*\/node_modules\/.*\/inquire_tmp.*/,
  /.*\/node_modules\/@protobufjs\/inquire_tmp.*/,
];

module.exports = config;
