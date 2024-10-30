import {hasArgs} from '@junobuild/cli-tools';
import {yellow} from 'kleur';

export const helpMode = `${yellow('-m, --mode')}            Set env mode. For example production or a custom string. Default is production.`;

export const helpOutput = (args?: string[]): 'doc' | 'cli' =>
  hasArgs({args, options: ['-d', '--doc']}) ? 'doc' : 'cli';
