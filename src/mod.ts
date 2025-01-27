import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { enableBotSpawning } from "../config/config.json";
import { buildWaves } from "./Spawning/Spawning";
import config from "../config/config.json";
import { globalValues } from "./GlobalValues";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { setupRoutes } from "./Routes/routes";
import checkPresetLogic from "./Tests/checkPresets";
import { setupSpawns } from "./SpawnZoneChanges/setupSpawn";
import { saveToFile } from "./utils";
import { updateBotSpawn, updatePlayerSpawn } from "./Spawns/updateUtils";

class Moar implements IPostSptLoadMod, IPreSptLoadMod, IPostDBLoadMod {
  preSptLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupRoutes(container);
      // updateBotSpawn("bnana", { x: 12, y: 21, z: 2 });
    }
  }

  postDBLoad(container: DependencyContainer): void {
    if (enableBotSpawning) {
      setupSpawns(container);
    }
  }

  postSptLoad(container: DependencyContainer): void {
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
