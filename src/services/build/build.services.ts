import { nextArg } from "@junobuild/cli-tools";
import { buildWithRust } from "./build.rust.services";

export const build = async (args?: string[]) => {

  const lang = nextArg({args, option: '-l'}) ?? nextArg({args, option: '--lang'});

  switch (lang?.toLowerCase()) {
    case "rs":
    case "rust":
      await buildWithRust();
      return;


  }



}