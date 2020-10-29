#!/usr/bin/env node
require('source-map-support').install()

const { MiraBootstrap } = require('../dist/src/cdk/bootstrap')

async function run () {
  try {
    await new MiraBootstrap().initialize()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
