import type {ChildProcess} from 'node:child_process';
import open, {apps} from 'open';

export const openUrl = async ({
  url,
  browser
}: {
  url: string;
  browser?: string;
}): Promise<ChildProcess> => {
  const {chrome, firefox, edge} = apps;

  let app: string | readonly string[] | undefined = undefined;
  switch (browser?.toLowerCase()) {
    case 'chrome':
      app = chrome;
      break;
    case 'firefox':
      app = firefox;
      break;
    case 'edge':
      app = edge;
      break;
    case 'safari':
      app = 'Safari';
      break;
    default:
      app = undefined;
  }

  return await open(url, app !== undefined ? {app: {name: app}} : undefined);
};
