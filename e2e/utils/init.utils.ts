import {testWithII} from '@dfinity/internet-identity-playwright';
import {CliPage} from '../page-objects/cli.page';
import {ConsolePage} from '../page-objects/console.page';

interface TestSuitePages {
  consolePage: ConsolePage;
  cliPage: CliPage;
}

export const initTestSuite = ({
  satelliteKind
}: {
  satelliteKind: 'website' | 'application';
}): (() => TestSuitePages) => {
  let consolePage: ConsolePage;
  let cliPage: CliPage;

  testWithII.beforeAll(async ({playwright}) => {
    testWithII.setTimeout(120000);

    const browser = await playwright.chromium.launch();

    const context = await browser.newContext();
    const page = await context.newPage();

    consolePage = await ConsolePage.initWithSignIn({
      page,
      context,
      browser
    });

    await consolePage.createSatellite({kind: satelliteKind});

    const satelliteId = await consolePage.copySatelliteID();

    cliPage = await CliPage.initWithEmulatorLogin({satelliteId});
  });

  testWithII.afterAll(async () => {
    const results = await Promise.allSettled([consolePage.close(), cliPage.close()]);

    if (results.find(({status}) => status === 'rejected')) {
      console.error(results);
      throw new Error('Failed to close test suite!');
    }
  });

  return (): TestSuitePages => ({
    consolePage,
    cliPage
  });
};
