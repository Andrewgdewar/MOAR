import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { enableBotSpawning } from "../config/config.json";
import { enableDifficultyChanges } from "../config/difficultyConfig.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { setupRoutes } from "./Routes/routes";
import checkPresetLogic from "./Tests/checkPresets";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import {
  BotDBChanges,
  BotRoutersAndGen,
} from "./BotDifficultyChanges/BotDifficultyChanges";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
  preSptLoad(container: DependencyContainer): void {
    enableDifficultyChanges && BotRoutersAndGen(container);
    if (enableBotSpawning) {
      setupRoutes(container);
    }
  }

  postDBLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupSpawns(container);
    }
  }

  postSptLoad(container: DependencyContainer): void {
    enableDifficultyChanges && BotDBChanges(container);
    if (enableBotSpawning) {
      checkPresetLogic(container);
      globalValues.baseConfig = config;
      globalValues.overrideConfig = {};
      const logger = container.resolve<ILogger>("WinstonLogger");
      logger.info(
        "\n[MOAR]: Starting up, may the bots ever be in your favour!"
      );
      buildWaves(container);
    }
  }
}

module.exports = { mod: new Moar() };
