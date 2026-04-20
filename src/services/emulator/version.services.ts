import {notEmptyString} from '@dfinity/utils';
import {clean} from 'semver';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {inspectImageVersion} from '../../utils/runner.utils';

export const findEmulatorVersion = async (): Promise<
  | {status: 'skipped'}
  | {status: 'error'; err: unknown}
  | {status: 'success'; version: string | undefined | null}
> => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    return {status: 'skipped'};
  }

  const {
    config: {derivedConfig}
  } = parsedResult;

  const inspectResult = await inspectImageVersion(derivedConfig);

  if ('err' in inspectResult) {
    return {status: 'error', err: inspectResult.err};
  }

  const {version: versionText} = inspectResult;

  const version = notEmptyString(versionText) ? clean(versionText) : undefined;

  return {status: 'success', version};
};
