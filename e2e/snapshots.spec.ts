import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getTestPages = initTestSuite();

testWithII('should create and restore a snapshot', async ({page}) => {
  const {consolePage, cliPage} = getTestPages();

  await cliPage.createSnapshot({target: 'satellite'});

  await cliPage.clearHosting();

  const satellitePage = await consolePage.visitSatelliteSite({
    title: 'Internet Computer - Error: response verification error'
  });
  await satellitePage.assertScreenshot();

  await cliPage.restoreSnapshot({target: 'satellite'});

  await satellitePage.reload();
  await satellitePage.assertScreenshot();
});
