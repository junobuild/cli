import {testWithII} from '@dfinity/internet-identity-playwright';
import {expect} from '@playwright/test';
import {initTestSuite} from './utils/init.utils';

const getTestPages = initTestSuite();

testWithII('should create a snapshot', async () => {
  const {consolePage, cliPage} = getTestPages();

  await cliPage.createSnapshot();

  await cliPage.clearHosting();

  const satellitePage = await consolePage.visitSatellite();

  await expect(satellitePage).toHaveScreenshot({fullPage: true});
});
