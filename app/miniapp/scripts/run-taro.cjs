#!/usr/bin/env node

const { spawnSync } = require('node:child_process')

const major = Number.parseInt(process.versions.node.split('.')[0], 10)

if (Number.isNaN(major) || major < 18 || major > 22) {
  console.error(
    '[miniapp] Taro 4 in this repo should run with Node.js 18-22. ' +
      `Current version: ${process.versions.node}.`
  )
  console.error(
    '[miniapp] 请先切到 Node 20 LTS 再执行 `pnpm dev:weapp` 或 `pnpm build:weapp`。'
  )
  process.exit(1)
}

const command = process.argv[2]
const args = process.argv.slice(3)

if (!command) {
  console.error('[miniapp] Missing taro command.')
  process.exit(1)
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env
  }
})

process.exit(result.status ?? 1)
