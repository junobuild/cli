import {testWithII} from '@dfinity/internet-identity-playwright';
import {assertNonNullish} from '@dfinity/utils';
import {CliPage} from '../page-objects/cli.page';
import {ConsolePage} from '../page-objects/console.page';

interface TestSuitePages {
  consolePage: ConsolePage;
  cliPage: CliPage;
}

export const initTestSuite = (): (() => TestSuitePages) => {
  testWithII.describe.configure({mode: 'serial'});

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

    await consolePage.createSatellite({kind: 'website'});

    // TODO: replace with a testId that copies to Satellite ID from the Overview
    const currentUrl = await page.evaluate(() => document.location.href);
    const url = URL.parse(currentUrl);
    assertNonNullish(url);
    const urlParams = new URLSearchParams(url.searchParams);
    const satelliteId = urlParams.get('s');
    assertNonNullish(satelliteId);

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
