const path = require('path');

const projectRoot = __dirname;
const appFolder = path.resolve(projectRoot, 'app');

process.env.EXPO_PROJECT_ROOT = projectRoot;
process.env.EXPO_ROUTER_APP_ROOT = './app';
process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

module.exports = function (api) {
  api.cache(true);

  const envReplacements = {
    EXPO_ROUTER_APP_ROOT: './app',
    EXPO_ROUTER_IMPORT_MODE: 'sync',
    EXPO_ROUTER_ABS_APP_ROOT: appFolder,
    EXPO_PROJECT_ROOT: projectRoot,
  };

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function ({ types: t }) {
        return {
          name: 'transform-expo-router-env',
          visitor: {
            MemberExpression(p) {
              if (
                p.node.object &&
                p.node.object.object &&
                p.node.object.object.name === 'process' &&
                p.node.object.property &&
                p.node.object.property.name === 'env' &&
                p.node.property
              ) {
                const varName = p.node.property.name || p.node.property.value;
                if (envReplacements[varName] !== undefined) {
                  p.replaceWith(t.stringLiteral(envReplacements[varName]));
                }
              }
            },
          },
        };
      },
    ],
  };
};
