import {magenta, yellow} from 'kleur';

export const targetOption = (action: 'upgrade' | 'backup'): string =>
  `${yellow('-t, --target')}          Which module type should be ${action === 'backup' ? 'backed up' : 'upgraded'}? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.`;

export const TARGET_OPTION_NOTE = `- Targets can be shortened to ${magenta('s')} for satellite, ${magenta('m')} for mission-control and ${magenta('o')} for orbiter.`;
