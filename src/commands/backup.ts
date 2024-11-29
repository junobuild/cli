import { eject } from "../services/eject.services";
import { build } from "../services/build.services";
import { start, stop } from "../services/docker.services";
import { red } from "kleur";
import { logHelpDev } from "../help/dev.help";
import { nextArg } from "@junobuild/cli-tools";
import { startStopMissionControl, startStopOrbiter, startStopSatellite } from "../services/start-stop.services";
import { logHelpStop } from "../help/stop.help";
import { logHelpStart } from "../help/start.help";
import { logHelpBackup } from "../help/backup.help";
import { createSnapshotSatellite } from "../services/backup/backup.satellite.services";
import { createSnapshotMissionControl } from "../services/backup/backup.mission-control.services";
import { createSnapshotOrbiter } from "../services/backup/backup.orbiter.services";

export const backup = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case 'create':
      await create();
      break;
    case 'restore':
      await build();
      break;
    case 'delete':
      await start();
      break;
    default:
      console.log(`${red('Unknown subcommand.')}`);
      logHelpDev();
  }
};

export const create = async (args?: string[]) => {
  const target = nextArg({args, option: '-t'}) ?? nextArg({args, option: '--target'});

  switch (target) {
    case 's':
    case 'satellite':
      await createSnapshotSatellite({args});
      break;
    case 'm':
    case 'mission-control':
      await createSnapshotMissionControl({args});
      break;
    case 'o':
    case 'orbiter':
      await createSnapshotOrbiter({args});
      break;
    default:
      console.log(`${red('Unknown target.')}`);
      logHelpBackup(args);
  }
}