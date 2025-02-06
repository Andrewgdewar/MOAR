import _config from "../../config/config.json";
import { ISpawnPointParam } from "@spt/models/eft/common/ILocationBase";
import { shuffle } from "./utils";
import mapConfig from "../../config/mapConfig.json";
import { BotSpawns, PlayerSpawns, SniperSpawns } from "../Spawns";
import { Ixyz } from "@spt/models/eft/common/Ixyz";
import { globalValues } from "../GlobalValues";
import { configLocations } from "./constants";

// const getDistance = (x: number, z: number, mX: number, mZ: number) => {
//   const pA1 = x - mX;
//   const pB2 = z - mZ;

//   return Math.sqrt(pA1 * pA1 + pB2 * pB2);
// };

function sq(n: number) {
  return n * n;
}

function pt(a: number, b: number) {
  return Math.sqrt(sq(a) + sq(b));
}

export const getDistance = (
  x: number,
  y: number,
  z: number,
  mX: number,
  mY: number,
  mZ: number
) => {
  (x = Math.abs(x - mX)), (y = Math.abs(y - mY)), (z = Math.abs(z - mZ));

  return pt(pt(x, z), y);
};

export default function getSortedSpawnPointList(
  SpawnPointParams: ISpawnPointParam[],
  mX: number,
  my: number,
  mZ: number,
  cull?: number
): ISpawnPointParam[] {
  let culledAmount = 0;

  const sortedCulledResult = SpawnPointParams.sort((a, b) => {
    const a1 = getDistance(
      a.Position.x,
      a.Position.y,
      a.Position.z,
      mX,
      my,
      mZ
    );
    const b1 = getDistance(
      b.Position.x,
      b.Position.y,
      b.Position.z,
      mX,
      my,
      mZ
    );
    return a1 - b1;
  }).filter((_, index) => {
    if (!cull) return true;
    const result = index > SpawnPointParams.length * cull;
    if (!result) culledAmount++;

    return result;
  });

  if (_config.debug && culledAmount > 0) {
    console.log(
      "Reduced to " +
        Math.round(
          (sortedCulledResult.length / SpawnPointParams.length) * 100
        ) +
        "% of original spawns",
      SpawnPointParams.length,
      ">",
      sortedCulledResult.length,
      "\n"
    );
  }
  return sortedCulledResult;
}

export function cleanClosest(
  SpawnPointParams: ISpawnPointParam[],
  mapIndex: number,
  player?: boolean
): ISpawnPointParam[] {
  const map = configLocations[mapIndex];

  const mapCullingNearPointValue = player
    ? mapConfig[map].mapCullingNearPointValuePlayer
    : mapConfig[map].mapCullingNearPointValue;
  const okayList = new Set();
  const filteredParams = SpawnPointParams.map((point) => {
    const {
      Position: { x: X, y: Y, z: Z },
    } = point;
    const result = !SpawnPointParams.some(({ Position: { z, x, y }, Id }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      return mapCullingNearPointValue > dist && dist !== 0 && !okayList.has(Id);
    });

    if (!result) {
      okayList.add(point.Id);
    }

    return result
      ? point
      : {
          ...point,
          ...(player
            ? {}
            : {
                DelayToCanSpawnSec: 9999999,
              }),
          CorePointId: 99999,
          Categories: [],
          Sides: [],
        };
  });

  if (_config.debug) {
    const actualCulled = filteredParams.filter(
      ({ Categories }) => !!Categories.length
    );
    console.log(
      map,
      filteredParams.length,
      ">",
      actualCulled.length,
      "Reduced to " +
        Math.round((actualCulled.length / filteredParams.length) * 100) +
        "% of original spawns",
      player ? "player" : "bot"
    ); // high, low}
  }

  return filteredParams;

  // if (!_config.debug) {
  //   const actualCulled = culled.filter(({ Categories }) => !!Categories.length);
  //   console.log(
  //     map,
  //     "Reduced to " +
  //     Math.round((actualCulled.length / culled.length) * 100) +
  //     "% of original spawns",
  //     culled.length,
  //     ">",
  //     actualCulled.length
  //     // "\n"
  //   ); // high, low}
  // }
}

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}

export const AddCustomBotSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string
) => {
  if (!BotSpawns[map] || !BotSpawns[map].length) {
    _config.debug && console.log("no custom Bot spawns for " + map);
    return SpawnPointParams;
  }

  const botSpawns = BotSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName: getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z),
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: random360(),
    Sides: ["Savage"],
  }));

  return [...SpawnPointParams, ...botSpawns];
};

export const AddCustomSniperSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string
) => {
  if (!SniperSpawns[map] || !SniperSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return SpawnPointParams;
  }

  const sniperSpawns = SniperSpawns[map].map((coords: Ixyz, index: number) => ({
    BotZoneName:
      getClosestZone(SpawnPointParams, coords.x, coords.y, coords.z) ||
      "custom_snipe_" + index,
    Categories: ["Bot"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    CorePointId: 1,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: "",
    Position: coords,
    Rotation: random360(),
    Sides: ["Savage"],
  }));

  return [...SpawnPointParams, ...sniperSpawns];
};

export const random360 = () => Math.random() * 360;

export const AddCustomPlayerSpawnPoints = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  pmcSpawns: ISpawnPointParam[]
) => {
  if (!PlayerSpawns[map] || !PlayerSpawns[map].length) {
    _config.debug && console.log("no custom Player spawns for " + map);
    return SpawnPointParams;
  }

  const combinedSpawns = [...SpawnPointParams, ...pmcSpawns];

  const getClosestInfil = (X: number, Y: number, Z: number) => {
    let closest = Infinity;
    let selectedInfil = "";

    combinedSpawns.forEach(({ Infiltration, Position: { x, y, z } }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      if (!!Infiltration && dist < closest) {
        closest = dist;
        selectedInfil = Infiltration;
      }
    });

    return selectedInfil;
  };

  const playerSpawns = PlayerSpawns[map].map((coords: Ixyz, index) => ({
    BotZoneName: "",
    Categories: ["Player"],
    ColliderParams: {
      _parent: "SpawnSphereParams",
      _props: {
        Center: {
          x: 0,
          y: 0,
          z: 0,
        },
        Radius: 20,
      },
    },
    CorePointId: 0,
    DelayToCanSpawnSec: 4,
    Id: uuidv4(),
    Infiltration: getClosestInfil(coords.x, coords.y, coords.z),
    Position: coords,
    Rotation: random360(),
    Sides: ["Pmc"],
  }));

  // TODO: Check infils

  return [...SpawnPointParams, ...playerSpawns];
};

export const getClosestZone = (
  params: ISpawnPointParam[],
  x: number,
  y: number,
  z: number
) => {
  if (
    Array.isArray(params) &&
    !params.filter(({ BotZoneName }) => BotZoneName).length
  )
    return "";

  return (
    getSortedSpawnPointList(params, x, y, z).find(
      ({ BotZoneName }) => !!BotZoneName
    )?.BotZoneName || ""
  );
};

export const removeClosestSpawnsFromCustomBots = (
  SpawnPointParams: ISpawnPointParam[],
  map: string,
  mapConfigMap: string
) => {
  if (!BotSpawns[map] || !BotSpawns[map].length) {
    console.log("No map called ", map);
    return;
  }

  const coords: Ixyz[] = BotSpawns[map];

  const mapCullingNearPointValue =
    mapConfig[mapConfigMap].mapCullingNearPointValue;

  let filteredCoords = coords.filter(
    ({ x: X, y: Y, z: Z }) =>
      !SpawnPointParams.some(({ Position: { z, x, y } }) => {
        return mapCullingNearPointValue > getDistance(X, Y, Z, x, y, z);
      })
  );

  const okayList = new Set();

  filteredCoords = [...coords].filter(({ x: X, y: Y, z: Z }, index) => {
    const result = !coords.some(({ z, x, y }) => {
      const dist = getDistance(X, Y, Z, x, y, z);
      return (
        mapCullingNearPointValue * 1.3 > dist &&
        dist !== 0 &&
        !okayList.has("" + x + y + z)
      );
    });
    if (!result) okayList.add("" + X + Y + Z);
    return result;
  });

  console.log(
    map,
    coords.length,
    ">",
    filteredCoords.length,
    "culled",
    coords.length - filteredCoords.length,
    "spawns"
  );
  return filteredCoords;
};
