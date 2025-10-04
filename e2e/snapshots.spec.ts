import {testWithII} from '@dfinity/internet-identity-playwright';
import {initTestSuite} from './utils/init.utils';

const getTestPages = initTestSuite();

const SNAPSHOT_TARGET = {target: 'satellite' as const};

testWithII('should create and restore a snapshot', async () => {
  const {consolePage, cliPage} = getTestPages();

  await cliPage.createSnapshot(SNAPSHOT_TARGET);

  await cliPage.clearHosting();

  const satellitePage = await consolePage.visitSatelliteSite({
    title: 'Internet Computer - Error: response verification error'
  });
  await satellitePage.assertScreenshot();

  await cliPage.restoreSnapshot(SNAPSHOT_TARGET);

  await satellitePage.reload();
  await satellitePage.assertScreenshot();
});

testWithII('should create, download, delete, upload and restore a snapshot', async () => {
  testWithII.slow();

  const {consolePage, cliPage} = getTestPages();

  await cliPage.createSnapshot(SNAPSHOT_TARGET);

  const {snapshotFolder} = await cliPage.downloadSnapshot(SNAPSHOT_TARGET);

  await cliPage.deleteSnapshot(SNAPSHOT_TARGET);

  // TODO: assert no snapshot

  await cliPage.clearHosting();

  const satellitePage = await consolePage.visitSatelliteSite({
    title: 'Internet Computer - Error: response verification error'
  });
  await satellitePage.assertScreenshot();

  await cliPage.uploadSnapshot({...SNAPSHOT_TARGET, folder: snapshotFolder});

  await cliPage.restoreSnapshot(SNAPSHOT_TARGET);

  await satellitePage.reload();
  await satellitePage.assertScreenshot();
});
