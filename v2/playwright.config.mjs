import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./test',
  testMatch:'**/*.spec.mjs',
  fullyParallel:false,
  workers:1,
  retries:0,
  timeout:120000,
  expect:{timeout:12000},
  reporter:[['list'],['html',{open:'never',outputFolder:'.test-output/report'}]],
  outputDir:'.test-output/results',
  use:{...devices['Desktop Chrome'],browserName:'chromium',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure',launchOptions:{executablePath:process.env.FISHING_CHROMIUM||undefined}}
});
