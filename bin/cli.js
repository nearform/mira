#!/usr/bin/env node
require('source-map-support').install()

const { MiraBootstrap } = require('../dist/src/cdk/bootstrap')
new MiraBootstrap().initialize()
