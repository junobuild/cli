import type {ChildProcess} from 'child_process';
import open from 'open';

export const openUrl = ({url, browser}: {url: string; browser?: string}): Promise<ChildProcess> => {
  const {
    apps: {chrome, firefox, edge}
  } = open;

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
  }

  return open(url, app !== undefined ? {app: {name: app}} : undefined);
};
