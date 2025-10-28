const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

exports.config = {
  user: process.env.LT_USER_NAME,
  key: process.env.LT_ACCESS_KEY,
  hostname: 'hub.lambdatest.com',
  port: 443,
  path: '/wd/hub',
  protocol: 'https',

  specs: ['./TestSuites/**/*.test.js'],
  exclude: [],

  maxInstances: 1,

  capabilities: [
    {
      browserName: 'Chrome',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'Windows 11',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Chrome on Windows 11',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Firefox',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'Windows 11',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Firefox on Windows 11',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'MicrosoftEdge',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'Windows 11',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Edge on Windows 11',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Brave',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'Windows 11',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Brave on Windows 11',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Safari',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'macOS Sonoma',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Safari on macOS',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Chrome',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'macOS Sonoma',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Chrome on macOS',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Firefox',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'macOS Sonoma',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Firefox on macOS',
        selenium_version: '4.21.0',
      },
    },
    {
      browserName: 'Brave',
      browserVersion: 'latest',
      'LT:Options': {
        platformName: 'macOS Sonoma',
        build: 'ASI Wallet Full Browser Suite',
        name: 'Brave on macOS',
        selenium_version: '4.21.0',
      },
    },
  ],

  logLevel: 'info',
  bail: 0,

  baseUrl: 'https://wallet.asi-chain.singularitynet.dev/',
  waitforTimeout: 10000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,

  services: ['lambdatest'],
  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 900000
  },

  afterTest: async function (test, context, { error }) {
    try {
        const status = error ? 'failed' : 'passed';
        const testName = `${test.parent} - ${test.title}`;
        await browser.executeScript(`lambda-name=${testName}`, []);
        await browser.executeScript(`lambda-status=${status}`, []);

        console.log(`🔁 Sent LambdaTest name: "${testName}" and status: ${status}`);
    } catch (err) {
        console.error('❗ LambdaTest update failed:', err.message);
    }

    await browser.pause(1000);
}

};
