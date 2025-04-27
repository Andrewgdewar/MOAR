import { IBotBase } from "@spt/models/eft/common/tables/IBotBase";
import { Role, globalValues } from "./GlobalValues";

export default class BotGen {
  public static assaultTypes: string[] = [
    "assaulteasy",
    "assaultnormal",
    "assaulthard",
    "cursedassaulteasy",
    "assaultimpossible",
    "cursedassaultnormal",
    "cursedassaulthard",
    "cursedassaultimpossible",
  ];

  public static bearTypes: string[] = [
    "pmcbeareasy",
    "pmcbearnormal",
    "pmcbearhard",
    "pmcbearimpossible",
  ];

  public static usecTypes: string[] = [
    "pmcuseceasy",
    "pmcusecnormal",
    "pmcusechard",
    "pmcusecimpossible",
  ];

  public static marksmanTypes: string[] = [
    "marksmaneasy",
    "marksmannormal",
    "marksmanhard",
    "marksmanimpossible",
  ];

  // Should produce a number from 0.75 to 1.25
  public static multipleWithRandomInt(int: number) {
    return int * (0.75 + Math.random() * Math.random());
  }

  public static getRandom(
    arr: Role[],
    progressedValue: number,
    maxValue: number
  ): Role {
    const progressLevels = maxValue / arr.length;
    let index = Math.round(
      BotGen.multipleWithRandomInt(progressedValue) / progressLevels
    );
    if (index > arr.length - 1) index = arr.length - 1;
    return arr[index];
  }

  static getBot(key: string): IBotBase {
    // globalValues.Logger.warning(`requested bot type ${key} from cache`);
    if ((globalValues.botGenerationCacheService as any).storedBots.has(key)) {
      const cachedOfType: IBotBase[] = (
        globalValues.botGenerationCacheService as any
      ).storedBots.get(key);

      if (cachedOfType.length > 0) {
        const cachedBot = cachedOfType[cachedOfType.length - 1];
        const level = cachedBot.Info.Level;
        switch (true) {
          // Scav
          case BotGen.assaultTypes.includes(key.toLowerCase()):
            const randomScav =
              globalValues.config.randomScavBrainChance > Math.random();
            if (randomScav) {
              const botsForRandom = globalValues.scavAlternates;
              const randomChoice =
                botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
              cachedBot.Info.Settings.Role =
                globalValues.roleCase[randomChoice];
              cachedBot.Info.Side = "Savage";
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nRANDOM: Creating Scav from ${key} with ${randomChoice} ${cachedBot.Info.Side}`
                );
              break;
            }
            const selectedMap =
              globalValues.database.locations[globalValues.RaidMap]?.base;
            const raidEndTime =
              globalValues.RaidStartTime + selectedMap.EscapeTimeLimit * 60000;
            const timeProgressed = Date.now() - globalValues.RaidStartTime;
            const raidTotalDuration = raidEndTime - globalValues.RaidStartTime;
            const currentlyProgressedPercentage =
              (timeProgressed / raidTotalDuration) * 100;

            const chosenAssault = BotGen.getRandom(
              globalValues.assaultRoleList,
              timeProgressed,
              raidTotalDuration
            );
            if (chosenAssault) {
              cachedBot.Info.Settings.BotDifficulty =
                chosenAssault.BotDifficulty;
              cachedBot.Info.Settings.Role = chosenAssault.Role;
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nCreating Scav from ${key}:${currentlyProgressedPercentage}% ${chosenAssault.Role} ${chosenAssault.BotDifficulty} ${cachedBot.Info.Side}`
                );
            }
            break;
          case BotGen.bearTypes.includes(key.toLowerCase()):
            const chosenBear = BotGen.getRandom(
              globalValues.bearRoleList,
              level,
              globalValues.difficultyConfig.pmcDifficultyMaxLevel
            );
            const randomBear =
              globalValues.config.randomPmcBrainChance > Math.random();
            if (randomBear && chosenBear) {
              const botsForRandom = globalValues.pmcAlternates;
              const randomChoice =
                botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
              cachedBot.Info.Settings.BotDifficulty = chosenBear.BotDifficulty;
              cachedBot.Info.Settings.Role =
                globalValues.roleCase[randomChoice];
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nRANDOM: Creating bear from ${key}: ${level} with ${randomChoice} ${cachedBot.Info.Side}`
                );
              break;
            }
            if (chosenBear) {
              cachedBot.Info.Settings.BotDifficulty = chosenBear.BotDifficulty;
              cachedBot.Info.Settings.Role = chosenBear.Role;
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nCreating bear from ${key}: ${level} ${chosenBear.Role} ${chosenBear.BotDifficulty} ${cachedBot.Info.Side}`
                );
            }
            break;
          case BotGen.usecTypes.includes(key.toLowerCase()):
            const chosenUsec = BotGen.getRandom(
              globalValues.usecRoleList,
              level,
              globalValues.difficultyConfig.pmcDifficultyMaxLevel
            );
            const randomUsec =
              globalValues.config.randomPmcBrainChance > Math.random();
            if (randomUsec && chosenUsec) {
              const botsForRandom = globalValues.pmcAlternates;
              const randomChoice =
                botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
              cachedBot.Info.Settings.BotDifficulty = chosenUsec.BotDifficulty;
              cachedBot.Info.Settings.Role =
                globalValues.roleCase[randomChoice];
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nRANDOM: Creating usec from ${key}: ${level} with ${randomChoice} ${cachedBot.Info.Side}`
                );
              break;
            }
            if (chosenUsec) {
              cachedBot.Info.Settings.BotDifficulty = chosenUsec.BotDifficulty;
              cachedBot.Info.Settings.Role = chosenUsec.Role;
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nCreating usec from ${key}: ${level} ${chosenUsec.Role} ${chosenUsec.BotDifficulty} ${cachedBot.Info.Side}`
                );
            }
            break;
          case BotGen.marksmanTypes.includes(key.toLowerCase()):
            const randomMarksman =
              globalValues.config.randomMarksmanBrainChance > Math.random();
            if (randomMarksman) {
              const botsForRandom = globalValues.marksmanAlternates;
              const randomChoice =
                botsForRandom[Math.floor(Math.random() * botsForRandom.length)];
              cachedBot.Info.Settings.BotDifficulty = "hard";
              cachedBot.Info.Settings.Role =
                globalValues.roleCase[randomChoice];
              globalValues.config.debug &&
                globalValues.Logger.warning(
                  `\nRANDOM: Creating marksman from ${key} with ${randomChoice} ${cachedBot.Info.Side}`
                );
              break;
            }
            break;
          default:
            globalValues.config.debug &&
              globalValues.Logger.warning(
                `\nDefault spawn: ${key} ${cachedBot.Info.Settings.Role} ${cachedBot.Info.Side}`
              );
            break;
        }

        return cachedOfType.pop();
      }

      globalValues.Logger.error(
        (
          globalValues.botGenerationCacheService as any
        ).localisationService.getText(
          "bot-cache_has_zero_bots_of_requested_type",
          key
        )
      );
    }

    globalValues.Logger.error(
      (
        globalValues.botGenerationCacheService as any
      ).localisationService.getText("bot-no_bot_type_in_cache", key)
    );

    return undefined;
  }
}
