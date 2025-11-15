import {expect} from '@playwright/test';
import {IdentityPage} from './identity.page';

export class SatellitePage extends IdentityPage {
  async reload({title}: {title: string} = {title: 'Juno / Satellite'}): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.page.reload({waitUntil: 'load'});
          return await this.page.title();
        },
        {
          timeout: 30000,
          intervals: [1_000, 2_000, 10_000]
        }
      )
      .toBe(title);
  }

  async assertScreenshot(): Promise<void> {
    await expect(this.page).toHaveScreenshot({fullPage: true});
  }
}
