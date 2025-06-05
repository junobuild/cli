import {hasArgs} from '@junobuild/cli-tools';

export const helpOutput = (args?: string[]): 'doc' | 'cli' =>
  hasArgs({args, options: ['-d', '--doc']}) ? 'doc' : 'cli';
