import {nextArg} from '@junobuild/cli-tools';
import {buildTypeScript} from './build.javascript';
import {buildRust} from './build.rust.services';

export const build = async (args?: string[]) => {
  const lang = nextArg({args, option: '-l'}) ?? nextArg({args, option: '--lang'});

  switch (lang?.toLowerCase()) {
    case 'rs':
    case 'rust':
      await buildRust();
      return;
    case 'ts':
    case 'typescript':
      await buildTypeScript();
      return;
  }
};
