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
      browserName: 'Safari',
      'lt:options': {
        platformName: 'iOS',
        deviceName: 'iPhone 12 Pro',
        platformVersion: '16',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Safari on iPhone 12 Pro',
        network: true,
        video: true,
        visual: true,
        console: true,
        project: 'Mobile smoke',
        w3c: true
      }
    },
    {
      browserName: 'Chrome',
      'lt:options': {
        platformName: 'Android',
        deviceName: 'Galaxy S23',
        platformVersion: '15',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on Galaxy S23',
        deviceOrientation: 'portrait',
        network: true,
        video: true,
        visual: true,
        console: true,
        project: 'Mobile smoke',
        w3c: true
      }
    },
    {
      browserName: 'Chrome',
      'lt:options': {
        platformName: 'Android',
        deviceName: 'Pixel 8 Pro',
        platformVersion: '14',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on Pixel 8 Pro',
        network: true,
        video: true,
        visual: true,
        console: true,
        project: 'Mobile smoke',
        w3c: true
      }
    },
    {
      browserName: 'Chrome',
      'lt:options': {
        platformName: 'Android',
        deviceName: 'OnePlus 11',
        platformVersion: '14',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on OnePlus 11',
        network: true,
        video: true,
        visual: true,
        console: true,
        project: 'Mobile smoke',
        w3c: true
      }
    },
    {
      browserName: 'Chrome',
      'lt:options': {
        platformName: 'Android',
        deviceName: 'Redmi 9',
        platformVersion: '10',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on Redmi 9',
        network: true,
        video: true,
        visual: true,
        console: true,
        project: 'Mobile smoke',
        w3c: true
      }
    }
  ],
  
  

  logLevel: 'info',
  bail: 0,

  waitforTimeout: 10000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,

  services: ['lambdatest'],
  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 1200000
  },

  afterTest: async function (test, context, { error }) {
    try {
      const status = error ? 'failed' : 'passed';
      await browser.executeScript(`lambda-status=${status}`, []);
      console.log(`🔁 Sent LambdaTest status: ${status}`);
    } catch (err) {
      console.error('❗ LambdaTest status update failed:', err.message);
    }
    await browser.pause(1000);
  }
};
