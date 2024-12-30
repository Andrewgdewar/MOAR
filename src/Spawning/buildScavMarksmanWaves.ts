import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import {
  configLocations,
  defaultEscapeTimes,
  defaultHostility,
  originalMapList,
} from "./constants";
import { MapSettings, shuffle, waveBuilder } from "./utils";
import { IWave, WildSpawnType } from "@spt/models/eft/common/ILocationBase";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { saveToFile } from "../utils";

export default function buildScavMarksmanWaves(
  config: typeof _config,
  locationList: ILocation[],
  botConfig: IBotConfig
) {
  let {
    debug,
    maxBotCap,
    scavWaveQuantity,
    scavWaveDistribution,
    snipersHaveFriends,
    maxBotPerZone,
    scavMaxGroupSize,
    scavDifficulty,
    moreScavGroups,
    allOpenZones,
  } = config;

  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    locationList[index].base = {
      ...locationList[index].base,
      ...{
        NewSpawn: false,
        OcculsionCullingEnabled: true,
        OfflineNewSpawn: false,
        OfflineOldSpawn: true,
        OldSpawn: true,
        BotSpawnCountStep: 0,
      },
    };

    locationList[index].base.NonWaveGroupScenario.Enabled = false;
    locationList[index].base["BotStartPlayer"] = 0;
    if (
      locationList[index].base.BotStop <
      locationList[index].base.EscapeTimeLimit * 60
    ) {
      locationList[index].base.BotStop =
        locationList[index].base.EscapeTimeLimit * 60;
    }

    const {
      maxBotPerZoneOverride,
      maxBotCapOverride,
      EscapeTimeLimit,
      scavHotZones,
    } = (mapConfig?.[map] as MapSettings) || {};

    // Set per map EscapeTimeLimit
    if (EscapeTimeLimit) {
      locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
      locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
    }

    // Set default or per map maxBotCap
    if (maxBotCapOverride || maxBotCap) {
      const capToSet = maxBotCapOverride || maxBotCap;
      // console.log(map, capToSet, maxBotCapOverride, maxBotCap);
      locationList[index].base.BotMax = capToSet;
      locationList[index].base.BotMaxPvE = capToSet;
      botConfig.maxBotCap[originalMapList[index]] = capToSet;
    }

    // Adjust botZone quantity
    if (maxBotPerZoneOverride || maxBotPerZone) {
      const BotPerZone = maxBotPerZoneOverride || maxBotPerZone;
      // console.log(map, BotPerZone, maxBotPerZoneOverride, maxBotPerZone);
      locationList[index].base.MaxBotPerZone = BotPerZone;
    }

    const sniperLocations = new Set(
      [...locationList[index].base.SpawnPointParams]
        .filter(
          ({ Categories, Sides, BotZoneName }) =>
            !!BotZoneName &&
            Sides.includes("Savage") &&
            !Categories.includes("Boss")
        )
        .filter(
          ({ BotZoneName, DelayToCanSpawnSec }) =>
            BotZoneName?.toLowerCase().includes("snipe") ||
            DelayToCanSpawnSec > 300
        )
        .map(({ BotZoneName }) => BotZoneName)
    );

    if (sniperLocations.size) {
      locationList[index].base.MinMaxBots = [
        {
          WildSpawnType: "marksman",
          max: sniperLocations.size * 5,
          min: sniperLocations.size,
        },
      ];
    }

    const scavZones = allOpenZones
      ? []
      : shuffle<string[]>([
          ...new Set(
            [...locationList[index].base.SpawnPointParams]
              .filter(
                ({ Categories, Sides, BotZoneName }) =>
                  !!BotZoneName &&
                  !Categories.includes("Boss") &&
                  (Sides.includes("Savage") || Sides.includes("All"))
              )
              .map(({ BotZoneName }) => BotZoneName)
              .filter((name) => !sniperLocations.has(name))
          ),
        ]);
    // console.log(map, scavZones.length);
    // Reduced Zone Delay
    locationList[index].base.SpawnPointParams = locationList[
      index
    ].base.SpawnPointParams.map((spawn) => ({
      ...spawn,
      DelayToCanSpawnSec:
        spawn.DelayToCanSpawnSec > 20
          ? Math.round(spawn.DelayToCanSpawnSec / 10)
          : spawn.DelayToCanSpawnSec,
    }));

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
    const { scavWaveCount } = mapConfig[map];

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    // Scavs
    const scavTotalWaveCount = Math.round(
      scavWaveCount * scavWaveQuantity * escapeTimeLimitRatio
    );

    config.debug &&
      escapeTimeLimitRatio !== 1 &&
      console.log(
        `${map} Scav wave count changed from ${scavWaveCount} to ${scavTotalWaveCount} due to escapeTimeLimit adjustment`
      );

    let snipers = waveBuilder(
      sniperLocations.size,
      Math.round(timeLimit / 4),
      0.5,
      WildSpawnType.MARKSMAN,
      0.7,
      false,
      2,
      [],
      shuffle([...sniperLocations]),
      80,
      false,
      true
    );

    if (snipersHaveFriends)
      snipers = snipers.map((wave) => ({
        ...wave,
        slots_min: 0,
        ...(snipersHaveFriends && wave.slots_max < 2
          ? { slots_min: 1, slots_max: 2 }
          : {}),
      }));

    const scavWaves = waveBuilder(
      scavTotalWaveCount,
      timeLimit,
      scavWaveDistribution,
      WildSpawnType.ASSAULT,
      scavDifficulty,
      false,
      scavMaxGroupSize,
      map === "gzHigh" ? [] : scavZones,
      scavHotZones,
      0,
      false,
      !!moreScavGroups
    );

    if (debug) {
      let totalscav = 0;
      scavWaves.forEach(({ slots_max }) => (totalscav += slots_max));

      console.log(configLocations[index]);
      console.log(
        "Scavs:",
        totalscav,
        "configVal",
        Math.round((totalscav / scavWaveCount) * 100) / 100,
        "configWaveCount",
        scavWaveCount,
        "waveCount",
        scavWaves.length,
        "\n"
      );
    }

    // const finalSniperWaves = snipers?.map(({ ...rest }, snipKey) => ({
    //   ...rest,
    //   number: snipKey,
    //   time_min: snipKey * 120,
    //   time_max: snipKey * 120 + 120,
    // }));
    // if (map === "customs") saveToFile({ scavWaves }, "scavWaves.json");
    locationList[index].base.waves = [...snipers, ...scavWaves]
      .sort(({ time_min: a }, { time_min: b }) => a - b)
      .map((wave, i) => ({ ...wave, number: i + 1 }));
  }
}
