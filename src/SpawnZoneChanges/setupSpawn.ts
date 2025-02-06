import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { configLocations, originalMapList } from "../Spawning/constants";
import { DependencyContainer } from "tsyringe";
import mapConfig from "../../config/mapConfig.json";
import advancedConfig from "../../config/advancedConfig.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import {
  AddCustomBotSpawnPoints,
  AddCustomPlayerSpawnPoints,
  AddCustomSniperSpawnPoints,
  cleanClosest,
  removeClosestSpawnsFromCustomBots,
} from "../Spawning/spawnZoneUtils";
import { shuffle } from "../Spawning/utils";
import { saveToFile } from "../utils";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { BotSpawns } from "../Spawns";
import { updateAllBotSpawns } from "../Spawns/updateUtils";
import { CoopUUIDS } from "./CoopUUIDS";

export const setupSpawns = (container: DependencyContainer) => {
  const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
  const { locations } = databaseServer.getTables();

  const indexedMapSpawns: Record<number, ISpawnPointParam[]> = {};

  const botSpawnHash = BotSpawns;

  const mapsToExcludeFromPlayerCulling = new Set([
    "factory4_day",
    "factory4_night",
    "laboratory",
  ]);

  const CoopUUIDSet = new Set(CoopUUIDS);
  originalMapList.forEach((map, mapIndex) => {
    const allZones = [
      ...new Set(
        locations[map].base.SpawnPointParams.filter(
          ({ BotZoneName }: ISpawnPointParam) => !!BotZoneName
        ).map(({ BotZoneName }: ISpawnPointParam) => BotZoneName)
      ),
    ];

    locations[map].base.OpenZones = allZones.join(",");

    let bossSpawn: ISpawnPointParam[] = [];
    let nonBossSpawns: ISpawnPointParam[] = [];
    let sniperSpawnSpawnPoints: ISpawnPointParam[] = [];
    let coopSpawns: ISpawnPointParam[] = [];

    const bossZoneList = new Set([
      "Zone_Blockpost",
      "Zone_RoofRocks",
      "Zone_RoofContainers",
      "Zone_RoofBeach",
      "Zone_TreatmentRocks",
      "Zone_TreatmentBeach",
      "Zone_Hellicopter",
      "Zone_Island",
      "BotZoneGate1",
      "BotZoneGate2",
      "BotZoneBasement",
    ]);
    const isGZ = map.includes("sandbox");
    shuffle<ISpawnPointParam[]>(locations[map].base.SpawnPointParams).forEach(
      (point) => {
        switch (true) {
          case point.Categories.includes("Boss") ||
            bossZoneList.has(point.BotZoneName):
            bossSpawn.push(point);
            break;

          case point.BotZoneName?.toLowerCase().includes("snipe") ||
            (map !== "lighthouse" && point.DelayToCanSpawnSec > 40):
            sniperSpawnSpawnPoints.push(point);
            break;

          case mapsToExcludeFromPlayerCulling.has(map) &&
            point.Categories.includes("Player") &&
            !!point.Infiltration:
            coopSpawns.push(point);
            break;
          default:
            nonBossSpawns.push(point);
            break;
        }
      }
    );

    // fix GZ
    if (isGZ) {
      sniperSpawnSpawnPoints.map((point, index) => {
        if (index < 2) {
          point.BotZoneName = Math.random()
            ? "ZoneSandSnipeCenter"
            : "ZoneSandSnipeCenter2";
        } else {
          point.BotZoneName = ["ZoneSandSnipeCenter", "ZoneSandSnipeCenter2"][
            index
          ];
        }
        return point;
      });
    }

    // console.log(map, sniperSpawnSpawnPoints.length);
    sniperSpawnSpawnPoints.map((val, index) => {
      if (!val.BotZoneName) val.BotZoneName = "custom_snipe_" + index; // TODO: Adjusted this watch for sniper weirdness
      return val;
    });

    const limit = mapConfig[configLocations[mapIndex]].spawnMinDistance;

    coopSpawns = AddCustomPlayerSpawnPoints(coopSpawns, map, nonBossSpawns);

    coopSpawns = cleanClosest(coopSpawns, mapIndex, true)
      .map((point, index) => {
        if (point.ColliderParams?._props?.Radius < limit) {
          point.ColliderParams._props.Radius = limit;
        }
        return !!point.Categories.length
          ? {
              ...point,
              Categories: ["Player"],
              BotZoneName: point?.BotZoneName ? point.BotZoneName : "",
              CorePointId: 0,
              Sides: ["Pmc"],
            }
          : point;
      })
      .filter((point) => {
        // Now we transfer the extra spawns to the bots
        // if (!point.Categories.length) {
        //   nonBossSpawns.push(point);
        // }
        return !!point.Categories.length;
      });

    if (advancedConfig.ActivateSpawnCullingOnServerStart) {
      botSpawnHash[map] =
        removeClosestSpawnsFromCustomBots(
          nonBossSpawns,
          map,
          configLocations[mapIndex]
        ) || [];
    }

    nonBossSpawns = cleanClosest(
      AddCustomBotSpawnPoints(nonBossSpawns, map),
      mapIndex
    ).map((point) => {
      if (point.ColliderParams?._props?.Radius < limit) {
        point.ColliderParams._props.Radius = limit;
      }

      return !!point.Categories.length
        ? {
            ...point,
            BotZoneName: isGZ ? "ZoneSandbox" : point?.BotZoneName || "",
            Categories: ["Bot"],
            Sides: ["Savage"],
            CorePointId: 1,
          }
        : point;
    });

    sniperSpawnSpawnPoints = AddCustomSniperSpawnPoints(
      sniperSpawnSpawnPoints,
      map
    );

    indexedMapSpawns[mapIndex] = [
      ...sniperSpawnSpawnPoints.map((point) => ({ ...point, type: "sniper" })),
      ...bossSpawn.map((point) => ({ ...point, type: "boss" })),
      ...nonBossSpawns.map((point) => ({ ...point, type: "nonBoss" })),
      ...coopSpawns.map((point) => ({ ...point, type: "coop" })),
    ];

    // const added = indexedMapSpawns[mapIndex].filter(
    //   ({ BotZoneName }) => BotZoneName?.slice(0, 6) === "Added_"
    // );
    // console.log(
    //   "sniperSpawnSpawnPoints",
    //   sniperSpawnSpawnPoints.length,
    //   "bossSpawn",
    //   bossSpawn.length,
    //   "nonBossSpawns",
    //   nonBossSpawns.length,
    //   "coopSpawns",
    //   coopSpawns.length,
    //   map
    // );

    //;
    // console.log(locations[map].base.SpawnPointParams.length, indexedMapSpawns[mapIndex].filter(({ Categories }) => Categories.length).length)

    locations[map].base.SpawnPointParams = [];
  });

  advancedConfig.ActivateSpawnCullingOnServerStart &&
    updateAllBotSpawns(botSpawnHash);
  globalValues.indexedMapSpawns = indexedMapSpawns;
};
