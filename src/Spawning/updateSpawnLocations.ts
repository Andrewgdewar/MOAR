import { ILocation } from "@spt/models/eft/common/ILocation";
import { configLocations } from "./constants";
import mapConfig from "../../config/mapConfig.json";
import _config from "../../config/config.json";

export default function updateSpawnLocations(
  locationList: ILocation[],
  config: typeof _config
) {
  for (let index = 0; index < locationList.length; index++) {
    const map = configLocations[index];

    const limit = mapConfig[map].spawnMinDistance;

    // console.log("\n" + map);
    locationList[index].base.SpawnPointParams.forEach(
      (
        { ColliderParams, BotZoneName, DelayToCanSpawnSec, Categories, Sides },
        innerIndex
      ) => {
        if (
          !Categories.includes("Boss") &&
          !BotZoneName?.toLowerCase().includes("snipe") &&
          DelayToCanSpawnSec < 300
        ) {
          // Make it so players can spawn anywhere.
          if (
            config.playerOpenZones &&
            Sides.includes("Pmc") &&
            Categories.length === 1 &&
            Categories[0] === "Player"
          ) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "All",
            ];

            // console.log(
            //   BotZoneName || "none",
            //   locationList[index].base.SpawnPointParams[innerIndex]
            //     .Categories,
            //   locationList[index].base.SpawnPointParams[innerIndex].Sides
            // );
          }

          if (
            config.pmcOpenZones &&
            Categories.includes("Bot") &&
            Sides[0] === "Savage"
          ) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "Bot",
              "Player",
            ];
            locationList[index].base.SpawnPointParams[innerIndex].Sides = [
              "All",
            ];

            // console.log(
            //   BotZoneName || "none",
            //   locationList[index].base.SpawnPointParams[innerIndex].Categories,
            //   locationList[index].base.SpawnPointParams[innerIndex].Sides
            // );
          }

          if (config.allOpenZones) {
            locationList[index].base.SpawnPointParams[innerIndex].Categories = [
              "All",
            ];
            locationList[index].base.SpawnPointParams[innerIndex].Sides = [
              "All",
            ];
          }

          if (
            ColliderParams?._props?.Radius !== undefined &&
            ColliderParams?._props?.Radius < limit
          ) {
            // console.log(
            //   "----",
            //   ColliderParams._props.Radius,
            //   "=>",
            //   limit,
            //   BotZoneName
            // );

            locationList[index].base.SpawnPointParams[
              innerIndex
            ].ColliderParams._props.Radius = limit;
          }
        }
      }
    );
  }
}
