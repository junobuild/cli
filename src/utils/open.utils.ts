import type {ChildProcess} from 'child_process';
import open from 'open';

export const openUrl = (url: string): Promise<ChildProcess> => open(url);
