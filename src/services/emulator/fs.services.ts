import {mkdir} from 'node:fs/promises';
import {readEmulatorConfig} from '../../configs/emulator.config';
import {type CliEmulatorDerivedConfig} from '../../types/emulator';

export const createDeployTargetDir = async ({
  targetDeploy
}: Pick<CliEmulatorDerivedConfig, 'targetDeploy'>) => {
  // Create output target/deploy if it does not yet exist.
  await mkdir(targetDeploy, {recursive: true});
};

export const readEmulatorConfigAndCreateDeployTargetDir = async () => {
  const parsedResult = await readEmulatorConfig();

  if (!parsedResult.success) {
    process.exit(1);
  }

  const {
    config: {
      derivedConfig: {targetDeploy}
    }
  } = parsedResult;
  await createDeployTargetDir({targetDeploy});
};
