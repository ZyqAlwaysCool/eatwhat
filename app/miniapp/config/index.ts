import path from 'node:path'

import { defineConfig, type UserConfigExport } from '@tarojs/cli'

import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig<'webpack5'>(async (merge, { mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'meal-decision-miniapp',
    date: '2026-03-29',
    designWidth: 375,
    deviceRatio: {
      375: 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    plugins: ['@tarojs/plugin-framework-react'],
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
      '@catalog': path.resolve(__dirname, '..', '..', 'api', 'catalog'),
      '@shared': path.resolve(__dirname, '..', '..', 'shared')
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }

  return mode === 'development' || process.env.NODE_ENV === 'development'
    ? merge({}, baseConfig, devConfig)
    : merge({}, baseConfig, prodConfig)
})
