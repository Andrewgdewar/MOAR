import { BotGenerationCacheService } from "@spt/services/BotGenerationCacheService";
import { StaticRouterModService } from "@spt/services/mod/staticRouter/StaticRouterModService";
import { DependencyContainer } from "tsyringe";
import BotGen from "./BotGen";
import { globalValues } from "./GlobalValues";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { makeDifficultyChanges } from "./DifficultyUtils";
import { cloneDeep } from "../utils";

export const BotDBChanges = (container: DependencyContainer): undefined => {
  const database = container
    .resolve<DatabaseServer>("DatabaseServer")
    .getTables();
  globalValues.database = database;
  globalValues.baseAI = cloneDeep(database.bots.types.pmcbot.difficulty.hard);

  makeDifficultyChanges();
  globalValues.config.debug &&
    console.log("MOAR Difficulty:  DB changes completed");
};

export const BotRoutersAndGen = (container: DependencyContainer): undefined => {
  const staticRouterModService = container.resolve<StaticRouterModService>(
    "StaticRouterModService"
  );
  globalValues.Logger = container.resolve("WinstonLogger");
  globalValues.botGenerationCacheService =
    container.resolve<BotGenerationCacheService>("BotGenerationCacheService");
  // container.resolve<TimeAndWeatherSettings>("WeatherController")

  container.afterResolution(
    "BotGenerationCacheService",
    (_t, result: BotGenerationCacheService) => {
      // globalValues.Logger.info(`POOP: BotGenerationCacheService calling LegendaryPlayer.getBot`);
      result.getBot = BotGen.getBot;
    },
    { frequency: "Always" }
  );

  globalValues.config.debug &&
    console.log("MOAR Difficulty:  BotGenerationCacheService Registered");

  //Raid start
  staticRouterModService.registerStaticRouter(
    `StaticAkiGameStartAlgorithmicDifficulty`,
    [
      {
        url: "/client/raid/configuration",
        action: async (url, info, sessionId, output) => {
          globalValues.RaidStartTime = Date.now();
          globalValues.RaidMap = info.location.toLowerCase();
          globalValues.config.debug &&
            globalValues.Logger.info(
              `MOAR Difficulty: RaidStartTime updated to: ${globalValues.RaidStartTime} ${globalValues.RaidMap}`
            );
          return output;
        },
      },
    ],
    "aki"
  );

  globalValues.config.debug &&
    console.log("MOAR Difficulty:  StaticAkiGameStartUpdater Registered");
};
