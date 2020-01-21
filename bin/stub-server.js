#!/usr/bin/env node

// @ts-check

/* eslint-disable @typescript-eslint/no-var-requires */

const express = require('express');
const { resolve } = require('path');

const { stubServer } = require('../dist/cjs/stubServer');

// See https://en.wikipedia.org/wiki/ANSI_escape_code
const ESC = {
  Reset: '\x1b[0m',
  Bold: '\x1b[1m',
  Blue: '\x1b[34m'
};
/** @param {string} text */
const emphasize = text => `${ESC.Bold}${ESC.Blue}${text}${ESC.Reset}`;

const config = resolve('stubs/config');
const host = 'localhost';
const port = 12345;

const app = express();
const server = app.listen(port, host, () => {
  const address = /** @type {import('net').AddressInfo} */ (server.address());
  console.log(
    `stub-server is running at ${emphasize(`http://${address.address}:${address.port}`)}`
  );
});

stubServer(config, app);