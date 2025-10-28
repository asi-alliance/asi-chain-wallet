const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

exports.config = {
  user: process.env.LT_USER_NAME,
  key: process.env.LT_ACCESS_KEY,
  hostname: 'hub.lambdatest.com',
  port: 443,
  path: '/wd/hub',
  protocol: 'https',

  specs: ['./TestSuites/**/*.js'],
  exclude: [],

  maxInstances: 1,

  capabilities: [
    // iPhone 12 Pro — iOS + Safari
    {
      browserName: 'Safari',
      'LT:Options': {
        platformName: 'iOS',
        deviceName: 'iPhone 12 Pro',
        platformVersion: '16',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Safari on iPhone 12 Pro',
        network: true,
        video: true,
        visual: true,
        console: true
      }
    },
  
    // Samsung Galaxy S23 — Android + Chrome
    {
      browserName: 'Chrome',
      'LT:Options': {
        platformName: 'Android',
        deviceName: 'Samsung Galaxy S23',
        platformVersion: '13',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on Samsung Galaxy S23',
        network: true,
        video: true,
        visual: true,
        console: true
      }
    },
  
    // OnePlus 11 — Android + Chrome
    {
      browserName: 'Chrome',
      'LT:Options': {
        platformName: 'Android',
        deviceName: 'OnePlus 11',
        platformVersion: '13',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on OnePlus 11',
        network: true,
        video: true,
        visual: true,
        console: true
      }
    },
  
    // Xiaomi 13 — Android + Chrome
    {
      browserName: 'Chrome',
      'LT:Options': {
        platformName: 'Android',
        deviceName: 'Xiaomi 13',
        platformVersion: '13',
        isRealMobile: true,
        build: 'ASI Wallet Tests - Mobile',
        name: 'Chrome on Xiaomi 13',
        network: true,
        video: true,
        visual: true,
        console: true
      }
    }
  ],
  
  

  logLevel: 'info',
  bail: 0,

  baseUrl: 'http://184.73.0.34:3000',
  waitforTimeout: 10000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,

  services: ['lambdatest'],
  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000
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
