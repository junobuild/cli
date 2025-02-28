import {magenta, yellow} from 'kleur';

export const targetOption = (action: 'upgrade' | 'snapshot'): string =>
  `${yellow('-t, --target')}          Which module type should be ${action === 'snapshot' ? 'snapshotted' : 'upgraded'}? Valid targets are ${magenta('satellite')}, ${magenta('mission-control')} or ${magenta('orbiter')}.`;

export const TARGET_OPTION_NOTE = `- Targets can be shortened to ${magenta('s')} for satellite, ${magenta('m')} for mission-control and ${magenta('o')} for orbiter.`;
