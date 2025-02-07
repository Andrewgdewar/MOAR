import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import _config from "../../config/config.json";
import { getRandomInArray, shuffle } from "./utils";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { globalValues } from "../GlobalValues";
import getSortedSpawnPointList from "./spawnZoneUtils";

export default function updateSpawnLocations(
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];
    const playerSpawns: ISpawnPointParam[] = [];
    // const addedSpawns: ISpawnPointParam[] = [];
    const mapSpawns = globalValues.indexedMapSpawns[index];

    const filteredSpawns = [...mapSpawns].filter((point) => {
      if (point?.["type"] === "coop") {
        playerSpawns.push(point);
        return false;
      }

      return true;
    });

    const playerSpawn: ISpawnPointParam = getRandomInArray(playerSpawns);

    // const convertedPlayerSpawns = playerSpawns
    //   .filter(({ Id }) => playerSpawn.Id !== Id)
    //   .map((point, pmcIndex) => ({
    //     ...point,
    //     ...{
    //       ...point,
    //       BotZoneName: "pmc_recycled" + pmcIndex,
    //       Categories: ["Bot"],
    //       Sides: ["Savage"],
    //       CorePointId: 1,
    //       type: "pmc",
    //     },
    //   }));

    const { x, y, z } = playerSpawn.Position;

    // console.log(map, playerSpawn.BotZoneName, playerSpawn.Position);

    const sortedSpawnPointList = getSortedSpawnPointList(
      filteredSpawns,
      x,
      y,
      z
    );

    // console.log(map, sortedSpawnPointList.filter((point) => point.CorePointId < 100).map((point) => point.CorePointId))

    // console.log(map, hash)

    locationList[index].base.SpawnPointParams = sortedSpawnPointList;

    playerSpawn.ColliderParams._props.Radius = 1;

    const listToAddToOpenZones = shuffle<string[]>([
      ...new Set(
        locationList[index].base.SpawnPointParams.map(
          (point) => point.BotZoneName
        )
      ),
    ]).filter((_, i) => i < 20);

    locationList[index].base.OpenZones = listToAddToOpenZones.join(",");

    locationList[index].base.SpawnPointParams.push(
      // ...convertedPlayerSpawns,
      playerSpawn
    );
  }
}
