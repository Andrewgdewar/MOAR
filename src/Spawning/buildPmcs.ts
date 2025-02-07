import { ILocation } from "@spt/models/eft/common/ILocation";
import _config from "../../config/config.json";
import mapConfig from "../../config/mapConfig.json";
import { defaultEscapeTimes, defaultHostility } from "./constants";
import { buildBotWaves, looselyShuffle, MapSettings, shuffle } from "./utils";
import { saveToFile } from "../utils";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function buildPmcs(
  config: typeof _config,
  locationList: ILocation[]
) {
  for (let index = 0; index < locationList.length; index++) {
    const mapSettingsList = Object.keys(mapConfig) as Array<
      keyof typeof mapConfig
    >;
    const map = mapSettingsList[index];

    // Set pmcs hostile to everything
    locationList[index].base.BotLocationModifier.AdditionalHostilitySettings =
      defaultHostility;

    const {
      pmcHotZones = [],
      pmcWaveCount,
      initialSpawnDelay,
    } = (mapConfig?.[map] as MapSettings) || {};

    const {
      Position: { x, y, z },
    } =
      locationList[index].base.SpawnPointParams[
        locationList[index].base.SpawnPointParams.length - 1
      ];

    let pmcZones = getSortedSpawnPointList(
      locationList[index].base.SpawnPointParams.filter(
        (point) => point["type"] === "pmc"
      ),
      x,
      y,
      z,
      0.1
    ).map(({ BotZoneName }) => BotZoneName);
    looselyShuffle(pmcZones, 2);

    // console.log(pmcZones);

    if (map === "laboratory") {
      pmcZones = new Array(10).fill(pmcZones).flat(1);
    }

    if (config.randomSpawns) pmcZones = shuffle<string[]>(pmcZones);

    const escapeTimeLimitRatio = Math.round(
      locationList[index].base.EscapeTimeLimit / defaultEscapeTimes[map]
    );

    let totalWaves = Math.round(
      pmcWaveCount * config.pmcWaveQuantity * escapeTimeLimitRatio
    );

    if (!!pmcHotZones.length && totalWaves > 0) {
      totalWaves = totalWaves + pmcHotZones.length;
    }

    while (totalWaves - pmcZones.length > 0) {
      console.log(
        `${map} ran out of appropriate zones for pmcs, duplicating zones`
      );
      // const addEmpty = new Array(numberOfZoneless).fill("");
      pmcZones = [...pmcZones, ...pmcZones];
      if (pmcZones.length === 0) {
        pmcZones = [""];
      }
    }

    if (config.debug) {
      console.log(`${map} PMC count ${totalWaves} \n`);

      escapeTimeLimitRatio !== 1 &&
        console.log(
          `${map} PMC wave count changed from ${pmcWaveCount} to ${totalWaves} due to escapeTimeLimit adjustment`
        );
    }

    const timeLimit = locationList[index].base.EscapeTimeLimit * 60;

    const half = Math.round(
      totalWaves % 2 === 0 ? totalWaves / 2 : (totalWaves + 1) / 2
    );

    const usecSpawns = pmcZones.filter((_, i) => i % 2 === 0);
    const bearSpawns = pmcZones.filter((_, i) => i % 2 !== 0);

    const pmcUSEC = buildBotWaves(
      half,
      config.startingPmcs ? Math.round(0.2 * timeLimit) : timeLimit,
      config.pmcMaxGroupSize - 1,
      config.pmcGroupChance,
      usecSpawns,
      config.pmcDifficulty,
      "pmcUSEC",
      false,
      config.pmcWaveDistribution,
      initialSpawnDelay + Math.round(10 * Math.random())
    );

    const pmcBEAR = buildBotWaves(
      half,
      config.startingPmcs ? Math.round(0.1 * timeLimit) : timeLimit,
      config.pmcMaxGroupSize - 1,
      config.pmcGroupChance,
      bearSpawns,
      config.pmcDifficulty,
      "pmcBEAR",
      false,
      config.pmcWaveDistribution,
      initialSpawnDelay + Math.round(10 * Math.random())
    );

    const pmcs = [...pmcUSEC, ...pmcBEAR];
    // console.log(pmcs.map(({ Time }) => Time));
    if (pmcs.length) {
      // Add hotzones if exist
      pmcHotZones.forEach((hotzone) => {
        const index = Math.floor(pmcs.length * Math.random());
        pmcs[index].BossZone = hotzone;
        // console.log(pmcs[index]);
      });
    }

    // console.log(
    //   map,
    //   pmcs.map(({ BossZone }) => BossZone)
    // );

    locationList[index].base.BossLocationSpawn = [
      ...pmcs,
      ...locationList[index].base.BossLocationSpawn,
    ];
  }
}
