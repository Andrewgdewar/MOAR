import { cloneDeep } from "../utils";
import { globalValues } from "./GlobalValues";
import {
  IDifficulties,
  IDifficultyCategories,
} from "@spt/models/eft/common/tables/IBotType";
import { ILocation } from "@spt/models/eft/common/ILocation";
import { IBotCore } from "@spt/models/eft/common/tables/IBotCore";

export const makeDifficultyChanges = () => {
  fillEmptyDifficultySlots();
  changeCoreAI();
  changeOverallMapDifficulty();
  // Fixes assaultGroup type?
  globalValues.database.bots.types.assaultgroup = cloneDeep(
    globalValues.database.bots.types.pmcbot
  );
  generateDifficultyLevels();
};

const generateDifficultyLevels = () => {
  const {
    bots,
    lowLevelDifficultyModifier,
    midLevelDifficultyModifier,
    highLevelDifficultyModifier,
    bossLevelDifficultyModifier,
  } = globalValues.difficultyConfig;

  let difficultySet;
  let difficultyModifier;
  for (let aiTypes in bots) {
    switch (aiTypes) {
      case "lowLevelAIs":
        difficultySet = [3.6, 3.8, 4, 4.2];
        difficultyModifier = lowLevelDifficultyModifier;
        break;
      case "midLevelAIs":
        difficultySet = [4, 4.2, 4.4, 4.6];
        difficultyModifier = midLevelDifficultyModifier;
        break;
      case "highLevelAIs":
        difficultySet = [4.4, 4.6, 4.8, 5];
        difficultyModifier = highLevelDifficultyModifier;
        break;
      case "bossLevelAIs":
        difficultySet = [4.8, 5, 5.2, 5.4];
        difficultyModifier = bossLevelDifficultyModifier;
        break;
      default:
        console.log(`${aiTypes} is being overwritten for some reason?`); //Should never appear if things are working properly.
        break;
    }

    bots[aiTypes].forEach((botTypeName) => {
      const currentBottDifficulty =
        globalValues.database.bots.types[botTypeName].difficulty;
      changeForAllDifficulties(
        currentBottDifficulty,
        difficultySet,
        difficultyModifier
      );
    });
  }
};

const changeForAllDifficulties = (
  currentBottDifficulty: IDifficulties,
  difficultySet: number[],
  difficultyModifier: number
) => {
  for (let i in difficultySet)
    difficultySet[i] =
      difficultySet[i] * 1 +
      difficultyModifier +
      globalValues.config.overallDifficultyModifier;

  //Cycle through all four difficulties for the given bot type
  changeAI(currentBottDifficulty["easy"], difficultySet[0]);
  changeAI(currentBottDifficulty["normal"], difficultySet[1]);
  changeAI(currentBottDifficulty["hard"], difficultySet[2]);
  changeAI(currentBottDifficulty["impossible"], difficultySet[3]);
};

export const changeOverallMapDifficulty = () => {
  const locations = globalValues.database.locations;
  const accuracyCoef = 1,
    scatteringCoef = 1,
    gainSightCoef = 0.5,
    marksmanCoef =
      globalValues.difficultyConfig.overallDifficultyMultipliers
        .sniperBotAccuracyMult,
    visibleDistCoef = 1;
  for (let mapName in locations) {
    if (mapName != "base") {
      let map = locations[mapName] as ILocation;

      //Maybe round this afterwards. Might cause problems if it's not rounded?
      map.base.BotLocationModifier.AccuracySpeed = 1 / Math.sqrt(accuracyCoef);
      map.base.BotLocationModifier.Scattering = scatteringCoef;
      map.base.BotLocationModifier.GainSight = gainSightCoef;
      map.base.BotLocationModifier.MarksmanAccuratyCoef =
        map.base.BotLocationModifier.MarksmanAccuratyCoef * marksmanCoef;
      map.base.BotLocationModifier.VisibleDistance = visibleDistCoef;
      map.base.BotLocationModifier.MagnetPower = 100;
      map.base.BotLocationModifier.DistToPersueAxemanCoef = 0.7;
      map.base.BotLocationModifier.DistToSleep = 350;
      map.base.BotLocationModifier.DistToActivate = 330;
      //Weird stuff going on with reserve. Variables need extra tweaking?
      if (["rezervbase"].includes(mapName)) {
        //map.base.BotLocationModifier.AccuracySpeed = map.base.BotLocationModifier.AccuracySpeed * (1/0.6)
        map.base.BotLocationModifier.AccuracySpeed =
          map.base.BotLocationModifier.AccuracySpeed * 1.45;
        map.base.BotLocationModifier.Scattering =
          map.base.BotLocationModifier.Scattering * 1.075;
        //map.base.BotLocationModifier.GainSight = map.base.BotLocationModifier.GainSight * (1/1.3)
      }
      if (["interchange"].includes(mapName)) {
        map.base.BotLocationModifier.Scattering /= 0.8;
        //map.base.BotLocationModifier.GainSight = map.base.BotLocationModifier.GainSight * (1/1.3)
      }
      //This should probably be done for Woods as well.
      if (["woods"].includes(mapName)) {
        map.base.BotLocationModifier.AccuracySpeed =
          map.base.BotLocationModifier.AccuracySpeed * 1.45;
        //map.base.BotLocationModifier.AccuracySpeed = map.base.BotLocationModifier.AccuracySpeed * 1.4
        map.base.BotLocationModifier.Scattering =
          map.base.BotLocationModifier.Scattering * 1.1;
        //map.base.BotLocationModifier.Scattering = map.base.BotLocationModifier.Scattering * 1.2
      }
      map.base.BotLocationModifier.AccuracySpeed *= 0.45;
      map.base.BotLocationModifier.Scattering *= 0.5;
      //	console.log(mapName)
      //	console.log(map.base.BotLocationModifier)
    }
  }
};

export const fillEmptyDifficultySlots = () => {
  const botTypes = globalValues.database.bots.types;
  let problemBots = ["followergluharsnipe", "assaultgroup"];
  for (let bot in botTypes)
    if (
      !botTypes[bot].difficulty ||
      !botTypes[bot].difficulty.easy ||
      !botTypes[bot].difficulty.easy.Lay
    )
      problemBots.push(bot);
  let solutionBot = "pmcbot";
  for (let bot in problemBots)
    botTypes[problemBots[bot]] = cloneDeep(botTypes[solutionBot]);

  botTypes["followertagilla"] = cloneDeep(botTypes.assault);
  botTypes["assaultgroup"].inventory.items = botTypes.bear.inventory.items;
};

export const changeCoreAI = () => {
  let core = globalValues.database.bots.core;

  core.START_DIST_TO_COV = 5; // START_DISTANCE_TO_COV These were fixed? check bots for cover usage
  core.MAX_DIST_TO_COV = 50; // MAX_DISTANCE_TO_COV
  core.COVER_SECONDS_AFTER_LOSE_VISION = 2;
  core.WEAPON_ROOT_Y_OFFSET = 0;
  core.LAY_DOWN_ANG_SHOOT = 10;
  core.CAN_SHOOT_TO_HEAD = false; //Configure?
  //Is this better higher or lower? Can it get them to group up more? I hope so.
  //core.MIN_MAX_PERSON_SEARCH = 5
  core.MAIN_TACTIC_ONLY_ATTACK = false;
  core.LAST_SEEN_POS_LIFETIME = 60;
  core.FLARE_POWER = 8;
  core.FLARE_TIME = 1.5;
  core.WAVE_ONLY_AS_ONLINE = false;
  // In theory, a higher number *should* mean that they'll group with more of their buddies. ..Right?
  // 300 is a super high default for that, though.
  // 300m is ~1.5 times the length of the construction site on Customs. Test this.
  // console.log(core.DIST_NOT_TO_GROUP)
  core.DIST_NOT_TO_GROUP = globalValues.difficultyConfig.botGroupDistance;
  //Automatically square it, because math is hard.
  core.DIST_NOT_TO_GROUP_SQR = core.DIST_NOT_TO_GROUP * core.DIST_NOT_TO_GROUP;
};

export const changeStat = (
  type,
  value,
  difficulty,
  botCat,
  multiplier?: number
) => {
  if (multiplier == undefined) multiplier = 1;

  let setValue;

  if (value.length == 1) {
    if (typeof value[0] == "number") botCat[type] = value[0] * multiplier;
    else botCat[type] = value[0];
    return;
  }

  let exceptions = [
    "VisibleDistance",
    "PART_PERCENT_TO_HEAL",
    "HearingSense",
    "AIMING_TYPE",
  ]; //Distance is on here because there's a config value to modify that on its own, same with hearing
  if (!exceptions.includes(type) && typeof value[0] == "number") {
    //Some values don't work with this system. Things with unusual caps, like visible angle.
    //These values must be whole numbers
    let decimalExceptions = [
      "BAD_SHOOTS_MIN",
      "BAD_SHOOTS_MAX",
      "MIN_SHOOTS_TIME",
      "MAX_SHOOTS_TIME",
    ];

    let divisor = 100;

    if (
      Math.trunc(difficulty) != difficulty &&
      !decimalExceptions.includes(type)
    ) {
      //If it's not a whole number.. ..Oh boy. We're getting into a rabbit hole now, aren't we?
      let newValues = [value[0]]; //An array with the lowest possible value as its starting point
      for (let val = 0; val < value.length - 1; val++) {
        let difference = value[val + 1] - value[val];
        for (let i = 0; i < divisor; i++)
          newValues.push(newValues[val * divisor + i] + difference / divisor);
      }
      value = newValues;
      difficulty = Math.round(difficulty * divisor);
    } else if (
      Math.trunc(difficulty) != difficulty &&
      decimalExceptions.includes(type)
    ) {
      difficulty = Math.round(difficulty);
    }
    let numValues = value.length - 1; //This should allow for variations in the size of the difficulty setting arrays.

    //Should allow for a smooth transition into difficulties greater than the standard 0-5 range
    if (difficulty > numValues) {
      if (value[numValues - 1] - value[numValues] < 0) {
        //going up
        setValue =
          value[numValues] +
          (value[numValues] - value[numValues - 1]) * (difficulty - numValues);
        if (setValue > 100 && type.slice(-4) == "_100") setValue = 100;
      } else if (value[numValues] == 0) setValue = 0;
      else
        setValue =
          value[numValues] *
          Math.pow(
            value[numValues] / value[numValues - 1],
            difficulty - numValues
          );
    } else if (difficulty < 0) {
      if (value[1] - value[0] < 0)
        //going up
        setValue = value[0] + (value[0] - value[1]) * (difficulty * -1);
      else if (value[0] <= 0) setValue = 0;
      else {
        setValue = value[0] * Math.pow(value[0] / value[1], difficulty * -1);
      }
    } else setValue = value[difficulty];
    if (Math.round(value[numValues]) == value[numValues])
      if (value.find((i) => Math.round[value[i]] == value[i])) {
        //If all values are integers, keep it that way
        //console.log(value)
        setValue = Math.round(setValue);
      }
  } else {
    let numValues = value.length - 1;
    difficulty = Math.round(difficulty);
    if (difficulty > numValues) difficulty = numValues;
    if (difficulty < 0) difficulty = 0;
    setValue = value[difficulty];
  }
  botCat[type] = Math.round(setValue * multiplier * 1000) / 1000;
};

export const changeAI = (
  botDiff: IDifficultyCategories,
  difficulty: number
) => {
  const excludedSettings = new Set(["REVENGE_BOT_TYPES", "WARN_BOT_TYPES"]);
  for (let category in botDiff) {
    for (let setting in botDiff[category]) {
      if (
        globalValues.baseAI[category] &&
        globalValues.baseAI[category][setting] &&
        !excludedSettings.has(setting)
      ) {
        botDiff[category][setting] = globalValues.baseAI[category][setting];
      }
    }
  }

  let botCat;

  //LAY
  botCat = botDiff.Lay;
  //LAY
  botCat.ATTACK_LAY_CHANCE = 5;

  //AIMING
  botCat = botDiff.Aiming;
  //AIMING
  //This variable is stupid and I hate it. Lower seems better, but it might rely heavily on other variables?
  // PoopDifficulty.changeStat("MAX_AIM_PRECICING", [1.0,1.2,1.4,1.6,1.7,1.8], difficulty, botCat)
  // PoopDifficulty.changeStat("MAX_AIM_PRECICING", [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0], difficulty, botCat)
  // PoopDifficulty.changeStat("MAX_AIM_PRECICING", [0.5,0.6,0.7,0.8,0.9,1.0,1.05,1.10,1.15,1.20,1.25], difficulty, botCat)
  changeStat(
    "MAX_AIM_PRECICING",
    [1.0, 1.05, 1.1, 1.15, 1.2, 1.25],
    difficulty,
    botCat
  );
  // changeStat("MAX_AIM_PRECICING", [2.1,2.1,2,1.9,1.8,1.7,1.6], difficulty, botCat)
  // botCat.MAX_AIM_PRECICING *= 30
  // botCat.MAX_AIM_PRECICING = 1
  // changeStat("MAX_AIM_PRECICING", [1,1,1,1,1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2], difficulty, botCat)
  changeStat(
    "BETTER_PRECICING_COEF",
    [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1],
    difficulty,
    botCat
  );

  botCat.BETTER_PRECICING_COEF *= 1;
  botCat.COEF_FROM_COVER = 0.9; //Lower seems better

  //Setting HARD_AIM to 100 made bots hilariously inaccurate. Smaller is better. Probably.
  changeStat(
    "HARD_AIM",
    [0.4, 0.35, 0.325, 0.3, 0.275, 0.25, 0.225],
    difficulty,
    botCat
  );
  botCat.HARD_AIM = botCat.HARD_AIM * 2;
  botCat.HARD_AIM = 0.75;
  botCat.CAN_HARD_AIM = false;
  //Max aiming upgrade by X many seconds? Unsure.
  //Seems to be the above, but it's.. Weird. Even at very high settings the AI *can* still land hits, it's just less likely.
  // changeStat("MAX_AIMING_UPGRADE_BY_TIME", [1.2,1.1,1,0.9,0.8,0.7], difficulty, botCat)
  changeStat(
    "MAX_AIMING_UPGRADE_BY_TIME",
    [1.5, 1.5, 1.35, 1.15, 1, 0.85, 0.7],
    difficulty,
    botCat
  );
  botCat.MAX_AIMING_UPGRADE_BY_TIME *= 2;
  // changeStat("DAMAGE_TO_DISCARD_AIM_0_100", [30,40,50,60,70,86,86], difficulty, botCat)
  botCat.DAMAGE_TO_DISCARD_AIM_0_100 = 28;
  botCat.SCATTERING_HAVE_DAMAGE_COEF = 1.3;
  //botCat.SHOOT_TO_CHANGE_PRIORITY = 55250
  botCat.DANGER_UP_POINT = 1.3; //test this
  changeStat("MIN_TIME_DISCARD_AIM_SEC", [1.5, 2, 2.5, 3], difficulty, botCat);
  changeStat(
    "MAX_TIME_DISCARD_AIM_SEC",
    [3.5, 4.5, 5.5, 6.5],
    difficulty,
    botCat
  );
  //This one is weird.
  // changeStat("MIN_TIME_DISCARD_AIM_SEC", [5,4.5,3.5,2.5,2], difficulty, botCat)
  // changeStat("MAX_TIME_DISCARD_AIM_SEC", [5.5,5,4.5,3.5,2.5], difficulty, botCat)
  // botCat.MIN_TIME_DISCARD_AIM_SEC >= (botCat.MAX_TIME_DISCARD_AIM_SEC * 1.1) ? botCat.MIN_TIME_DISCARD_AIM_SEC = botCat.MAX_TIME_DISCARD_AIM_SEC / 1.1 : null

  changeStat(
    "XZ_COEF",
    [0.5, 0.5, 0.5, 0.48, 0.475, 0.45, 0.4, 0.375, 0.35, 0.325, 0.3, 0.3],
    difficulty,
    botCat
  );
  //changeStat("XZ_COEF", [0.35,0.3,0.25,0.2,0.015,0.1], difficulty, botCat)
  botCat.XZ_COEF = botCat.XZ_COEF * 2.5;
  //When BOTTOM_COEF is high, the AI just doesn't shoot?
  changeStat("BOTTOM_COEF", [0.6, 0.5, 0.4], difficulty, botCat);
  botCat.BOTTOM_COEF = 0.6;
  changeStat(
    "FIRST_CONTACT_ADD_SEC",
    [1, 0.75, 0.5, 0.4, 0.3, 0.3],
    difficulty,
    botCat
  );
  changeStat(
    "FIRST_CONTACT_ADD_CHANCE_100",
    [75, 65, 55, 40, 50, 35],
    difficulty,
    botCat
  );
  //botCat.FIRST_CONTACT_ADD_CHANCE_100 = 0
  botCat.BASE_HIT_AFFECTION_DELAY_SEC = 0.57;
  //botCat.BASE_HIT_AFFECTION_DELAY_SEC = 0.3;
  botCat.BASE_HIT_AFFECTION_MIN_ANG = 4.0;
  botCat.BASE_HIT_AFFECTION_MAX_ANG = 9.0;
  //What does SHIEF stand for? What is this number doing?
  //Apparently higher is worse. Good to know.
  // changeStat("BASE_SHIEF", [0.7,0.6,0.5,0.4,0.35,0.3,0.25,0.22,0.2,0.2], difficulty, botCat)
  changeStat(
    "BASE_SHIEF",
    [
      0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.4, 0.45, 0.43, 0.41, 0.38, 0.35,
      0.32, 0.31, 0.3,
    ],
    difficulty,
    botCat
  );
  botCat.BASE_SHIEF *= 2;
  changeStat(
    "SCATTERING_DIST_MODIF",
    [0.7, 0.675, 0.65, 0.625, 0.6, 0.55, 0.5, 0.475, 0.45, 0.425, 0.4, 0.375],
    difficulty,
    botCat
  );
  //changeStat("SCATTERING_DIST_MODIF_CLOSE", [0.5,0.475,0.45,0.425,0.4,0.375], difficulty, botCat)
  changeStat(
    "SCATTERING_DIST_MODIF_CLOSE",
    [0.39, 0.385, 0.38, 0.375, 0.35, 0.325],
    difficulty,
    botCat
  );
  botCat.SCATTERING_DIST_MODIF = 0.8;
  // botCat.SCATTERING_DIST_MODIF_CLOSE = 0.35
  botCat.SCATTERING_DIST_MODIF *= 1;
  botCat.SCATTERING_DIST_MODIF /= 1.1;
  // botCat.SCATTERING_DIST_MODIF_CLOSE *= 0.4
  botCat.SCATTERING_DIST_MODIF_CLOSE *= 1;
  //botCat.SCATTERING_DIST_MODIF_CLOSE /= 1.2

  // botCat.SCATTERING_DIST_MODIF = 1
  // botCat.SCATTERING_DIST_MODIF_CLOSE = 2

  //botCat.SCATTERING_DIST_MODIF = 0
  //Do I need the scattering at long range? It seems this only applies to the bots when they're moving, or something.
  //botCat.SCATTERING_DIST_MODIF_CLOSE = 0
  //INVESTIGAVE THIS
  //Using 3 now because a tiny xz value for the fish-wiggle is very useful for preventing the AI from locking itself into uselessness up-close
  //So apparently 1 = ???, 2 = No aiming for legs, 3 = Aim anywhere, 4 =	5 =
  changeStat("AIMING_TYPE", [5, 5, 5, 5, 5, 3, 3], difficulty, botCat);
  changeStat("AIMING_TYPE", [5, 5, 5, 4, 4, 4, 4, 3, 3], difficulty, botCat);
  if (
    globalValues.difficultyConfig.overallDifficultyMultipliers.allowAimAtHead ==
    false
  )
    botCat.AIMING_TYPE == 3 ? (botCat.AIMING_TYPE = 4) : null;

  botCat.SHPERE_FRIENDY_FIRE_SIZE = 0.1;
  changeStat("COEF_IF_MOVE", [1.4, 1.3, 1.2, 1.1, 1, 1], difficulty, botCat);
  botCat.TIME_COEF_IF_MOVE = 2;
  botCat.BOT_MOVE_IF_DELTA = 0.01;
  botCat.ANY_PART_SHOOT_TIME = 30;
  //Is this what makes them turn their flashlights on to blind you?
  changeStat(
    "ANYTIME_LIGHT_WHEN_AIM_100",
    [35, 45, 55, 65, 75, 85],
    difficulty,
    botCat
  );
  //botCat.ANYTIME_LIGHT_WHEN_AIM_100 = 0;
  //INVESTIGATE THIS
  //Still have no idea what this does. Made it 100. made it 0.001. AI behaved basically the same.
  //Seems to have some effect now, probably in combination with some other change I made, but maybe due to AKi changes?
  //Setting this to 1000 added maybe three seconds to the time it took a point-blank AI to acquire me. Does not seem related to spotting time, only aiming time. A bot firing on automatic hit me immediately from ~5m away. -The effect may be per-bullet, or something?
  changeStat(
    "MAX_AIM_TIME",
    [1.1, 1, 0.95, 0.92, 0.89, 0.87, 0.85, 0.8, 0.7, 0.6, 0.5, 0.4],
    difficulty,
    botCat
  );
  botCat.MAX_AIM_TIME *= 0.6;
  botCat.WEAPON_ROOT_OFFSET = 0.35;
  //botCat.OFFSET_RECAL_ANYWAY_TIME = 1;
  //botCat.RECALC_MUST_TIME = 1;
  //These are coefs. -Presumably of WEAPON_ROOT_OFFSET? -Nope. They're completely separate.
  //..does an X offset exist?
  // changeStat("Y_TOP_OFFSET_COEF", [0,0.1,0.2,0.3,.4,0.5], difficulty, botCat)
  // changeStat("Y_BOTTOM_OFFSET_COEF", [0,0,0.1,0.1,0.2,0.2], difficulty, botCat)
  botCat.Y_TOP_OFFSET_COEF = 2;
  botCat.Y_BOTTOM_OFFSET_COEF = 2;
  // changeStat("ENEMY_Y_WEAPON_OFFSET", [0.08,0.06,0.04,0.03,0.02,0.01], difficulty, botCat)
  //Removed in the assembly || botCat.ENEMY_Y_WEAPON_OFFSET = 0.08;
  botCat.XZ_COEF_STATIONARY_GRENADE = 0.2;
  //Unsure of exactly what these do, but it makes the 'shoot to the left' issue a little less awful if they're high?
  //Alright. So apparently this ties into BAD_SHOOTS. BAD_SHOOTS cannot happen inside the no offset range
  botCat.DIST_TO_SHOOT_NO_OFFSET = 3;
  botCat.DIST_TO_SHOOT_TO_CENTER = 3;
  //Further testing revealed this actually does do something, you just have to have offset values that are noticeable
  //What was happening was that, for some strange reason, using the changeStat function to change a stat that doesn't naturally exist for a given AI (As is the case for BAD_SHOOTS stuff, and maybe others I haven't discovered yet) does nothing. You have to set it specifically first, then run the changeStat function. -That's part of what the bit of code at the top of this function is for.
  //BAD_SHOOTS only seems to apply to the first shots an AI fires at a target. If they use up all their BAD_SHOOTS, it does not matter how long you wait, they won't get any BAD_SHOOTS again.
  // changeStat("BAD_SHOOTS_MIN", [2,2,1,1,0,0], difficulty, botCat)
  // changeStat("BAD_SHOOTS_MAX", [3,3,3,2,2,1], difficulty, botCat)
  botCat.BAD_SHOOTS_MIN = 0;
  botCat.BAD_SHOOTS_MAX = 0;
  //changeStat("BAD_SHOOTS_OFFSET", [0.35,0.3,0.25,0.2,0.15,0.1], difficulty, botCat)
  botCat.BAD_SHOOTS_OFFSET = 2;
  botCat.BAD_SHOOTS_MAIN_COEF = 0.25;
  changeStat(
    "MIN_DAMAGE_TO_GET_HIT_AFFETS",
    [10, 15, 20, 25, 35, 50],
    difficulty,
    botCat
  );
  // botCat.MIN_DAMAGE_TO_GET_HIT_AFFETS = botCat.MIN_DAMAGE_TO_GET_HIT_AFFETS * 5
  changeStat("PANIC_TIME", [2, 1.5, 1, 0.6, 0.3, 0.1, 0.1], difficulty, botCat);
  changeStat("DAMAGE_PANIC_TIME", [12, 9, 6, 4, 2, 1], difficulty, botCat);

  botCat.BASE_SHIEF *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiAccuracyMult;
  botCat.MAX_AIM_TIME *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiAimSpeedMult;
  botCat.SCATTERING_DIST_MODIF *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;
  //Take only half of the normal multiplier, regardless of if positive or negative
  botCat.SCATTERING_DIST_MODIF_CLOSE *=
    (Math.sqrt(
      Math.pow(
        globalValues.difficultyConfig.overallDifficultyMultipliers
          .aiShotSpreadMult,
        2
      )
    ) /
      2) *
    (globalValues.difficultyConfig.overallDifficultyMultipliers
      .aiShotSpreadMult /
      Math.sqrt(
        Math.pow(
          globalValues.difficultyConfig.overallDifficultyMultipliers
            .aiShotSpreadMult,
          2
        )
      ));

  //LOOK
  botCat = botDiff.Look;
  //LOOK
  // NO LONGER USED botCat.ONLY_BODY = false //Currently testing
  changeStat("FAR_DISTANCE", [55, 70, 85], difficulty, botCat);
  changeStat("MIDDLE_DIST", [25, 35, 45], difficulty, botCat);

  //Not entirely convinced this does much
  changeStat(
    "FarDeltaTimeSec",
    [4.7, 4.1, 3.5, 3, 2.4, 1.8, 1.5, 1.2, 1, 1],
    difficulty,
    botCat
  );
  changeStat(
    "MiddleDeltaTimeSec",
    [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.6, 0.4, 0.4],
    difficulty,
    botCat
  );
  changeStat(
    "CloseDeltaTimeSec",
    [1.3, 1.2, 1.1, 1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.1],
    difficulty,
    botCat
  );
  botCat.CloseDeltaTimeSec *= 0.5;
  botCat.MiddleDeltaTimeSec *= 2.89;
  botCat.FarDeltaTimeSec *= 5.1;

  //Ugh I should clean this up.
  // botCat.CloseDeltaTimeSec *= 0.5
  // botCat.MiddleDeltaTimeSec *= 0.85
  // botCat.FarDeltaTimeSec *= 3

  // botCat.CloseDeltaTimeSec *= 0.7
  // botCat.MiddleDeltaTimeSec *= 2

  // botCat.CloseDeltaTimeSec *= 1.2
  // botCat.MiddleDeltaTimeSec *= 1.7
  // botCat.FarDeltaTimeSec *= 1.7

  //I have no idea what any of this means. Oh well.
  //Could it be related to when an AI can't see you anymore?
  botCat.GOAL_TO_FULL_DISSAPEAR = 2; //1.1;
  //Check this one. Assault is 0.0001, Kojaniy is 0.03
  // botCat.GOAL_TO_FULL_DISSAPEAR_SHOOT = 0.09//0.03;
  botCat.CAN_LOOK_TO_WALL = false;
  botCat.CloseDeltaTimeSec *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiVisionSpeedMult;
  botCat.MiddleDeltaTimeSec *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiVisionSpeedMult;
  botCat.FarDeltaTimeSec *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiVisionSpeedMult;

  //SHOOT
  botCat = botDiff.Shoot;
  //SHOOT
  //Test this one. Appears on cultists. Cultist default is 0.3
  botCat.FINGER_HOLD_STATIONARY_GRENADE = 0.01;
  changeStat(
    "RECOIL_TIME_NORMALIZE",
    [0.36, 0.33, 0.3, 0.27, 0.24, 0.21, 0.19],
    difficulty,
    botCat
  );
  changeStat(
    "RECOIL_TIME_NORMALIZE",
    [0.12, 0.12, 0.12, 0.12, 0.11, 0.1, 0.095],
    difficulty,
    botCat
  );
  // botCat.RECOIL_TIME_NORMALIZE = 0.12
  // changeStat("RECOIL_PER_METER", [0.115,0.105,0.095,0.085,0.075,0.065,0.055], difficulty, botCat)
  // changeStat("MAX_RECOIL_PER_METER", [0.4,0.3,0.2,0.175,0.15,0.1], difficulty, botCat)
  botCat.RECOIL_PER_METER = 0.09;
  // botCat.RECOIL_PER_METER *= 0.9
  botCat.RECOIL_PER_METER *= 1.4;
  botCat.MAX_RECOIL_PER_METER = 0.1;
  // botCat.MAX_RECOIL_PER_METER *= 1
  botCat.MAX_RECOIL_PER_METER *= 1.6;
  // botCat.HORIZONT_RECOIL_COEF = 1.4
  // changeStat("HORIZONT_RECOIL_COEF",[3.2,3.1,3,2.85,2.7,2.55,2.4], difficulty, botCat)
  botCat.HORIZONT_RECOIL_COEF = 1;
  //botCat.MAX_RECOIL_PER_METER = botCat.MAX_RECOIL_PER_METER * 0.4
  //botCat.MAX_RECOIL_PER_METER *= 10
  //botCat.RECOIL_PER_METER = botCat.MAX_RECOIL_PER_METER / 50
  //botCat.RECOIL_DELTA_PRESS = 0.15
  //changeStat("HORIZONT_RECOIL_COEF", [0.6,0.5,0.4,0.3,0.2,0.1], difficulty, botCat)
  //botCat.HORIZONT_RECOIL_COEF = botCat.HORIZONT_RECOIL_COEF * 2
  botCat.WAIT_NEXT_SINGLE_SHOT = 0.1;
  changeStat(
    "WAIT_NEXT_SINGLE_SHOT_LONG_MAX",
    [2.3, 1.8, 1.3, 0.9, 0.75, 0.5],
    difficulty,
    botCat
  );
  botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MIN =
    botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MAX / 4;
  //changeStat("WAIT_NEXT_SINGLE_SHOT_LONG_MIN", [0.4,0.3,0.2,0.15,0.15,0.15], difficulty, botCat)
  changeStat(
    "BASE_AUTOMATIC_TIME",
    [0.2, 0.5, 0.8, 0.9, 1, 1.1, 1.2, 1.2],
    difficulty,
    botCat
  );
  changeStat(
    "CHANCE_TO_CHANGE_TO_AUTOMATIC_FIRE_100",
    [65, 75, 80, 85, 90, 95, 100, 100],
    difficulty,
    botCat
  );
  botCat.FAR_DIST_ENEMY = 25.0;
  botCat.FAR_DIST_ENEMY_SQR = botCat.FAR_DIST_ENEMY * botCat.FAR_DIST_ENEMY;
  //botCat.MAX_DIST_COEF = 1;
  botCat.CAN_SHOOTS_TIME_TO_AMBUSH = 0;
  botCat.LOW_DIST_TO_CHANGE_WEAPON = 5.0;
  botCat.FAR_DIST_TO_CHANGE_WEAPON = 30.0;
  botCat.AUTOMATIC_FIRE_SCATTERING_COEF = 1.4;
  //		botCat.MARKSMAN_DIST_SEK_COEF = 1000;
  //Using multipliers from config
  botCat.WAIT_NEXT_SINGLE_SHOT =
    botCat.WAIT_NEXT_SINGLE_SHOT *
    globalValues.difficultyConfig.overallDifficultyMultipliers
      .semiAutoFireRateMult;
  botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MAX =
    botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MAX *
    globalValues.difficultyConfig.overallDifficultyMultipliers
      .semiAutoFireRateMult;
  botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MIN =
    botCat.WAIT_NEXT_SINGLE_SHOT_LONG_MIN *
    globalValues.difficultyConfig.overallDifficultyMultipliers
      .semiAutoFireRateMult;
  // botCat.RECOIL_TIME_NORMALIZE = botCat.RECOIL_TIME_NORMALIZE * config.overallDifficultyMultipliers.aiRecoilMult
  botCat.RECOIL_PER_METER =
    botCat.RECOIL_PER_METER *
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiRecoilMult;
  botCat.MAX_RECOIL_PER_METER =
    botCat.MAX_RECOIL_PER_METER *
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiRecoilMult;
  botCat.HORIZONT_RECOIL_COEF =
    botCat.HORIZONT_RECOIL_COEF *
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiRecoilMult;
  botCat.SHOOT_FROM_COVER = 5;
  botCat.MAX_DIST_COEF = 1.2;
  botCat.TRY_HIT_PERIOD_MELEE = 4;

  //MOVE
  botCat = botDiff.Move;
  //MOVE
  botCat.RUN_IF_CANT_SHOOT = true;

  //GRENADE
  botCat = botDiff.Grenade;
  //GRENADE
  //INVESTIGATE. Is this shouting for when they throw grenades, or when they sense you throwing them?
  botCat.CHANCE_TO_NOTIFY_ENEMY_GR_100 = 70.0;
  botCat.AMBUSH_IF_SMOKE_IN_ZONE_100 = 5;
  botCat.SMOKE_SUPPRESS_DELTA = 25;

  //Play with these sometime
  //botCat.MAX_FLASHED_DIST_TO_SHOOT = 10
  //botCat.MAX_FLASHED_DIST_TO_SHOOT_SQRT = botCat.MAX_FLASHED_DIST_TO_SHOOT * botCat.MAX_FLASHED_DIST_TO_SHOOT
  //botCat.FLASH_GRENADE_TIME_COEF = 0.3
  //botCat.SIZE_SPOTTED_COEF = 2
  //botCat.BE_ATTENTION_COEF = 4
  //botCat.TIME_SHOOT_TO_FLASH = 4

  //CHANGE
  botCat = botDiff.Change;
  //CHANGE

  botCat.SMOKE_VISION_DIST = 0.05;
  // botCat.SMOKE_GAIN_SIGHT = 1.6
  // botCat.SMOKE_SCATTERING = 1.6
  // botCat.SMOKE_PRECICING = 1.6
  // botCat.SMOKE_HEARING = 1
  // botCat.SMOKE_ACCURATY = 1.6
  // botCat.SMOKE_LAY_CHANCE = 1.6
  // botCat.FLASH_VISION_DIST = 0.05
  // botCat.FLASH_GAIN_SIGHT = 1.8
  // botCat.FLASH_SCATTERING = 1.6
  // botCat.FLASH_PRECICING = 1.6
  // botCat.FLASH_HEARING = 1
  // botCat.FLASH_ACCURATY = 1.6
  // botCat.FLASH_LAY_CHANCE = 1
  // botCat.STUN_HEARING = 0.01

  botCat.MIN_DIST_NOT_TO_THROW = 8;
  changeStat(
    "MIN_THROW_GRENADE_DIST",
    [12, 11, 10, 9, 8, 8],
    difficulty,
    botCat
  );
  changeStat("MAX_THROW_POWER", [15, 18, 21], difficulty, botCat);
  changeStat(
    "GrenadePrecision",
    [0.3, 0.2, 0.15, 0.1, 0.075, 0.05],
    difficulty,
    botCat
  );
  //botCat.RUN_AWAY = 22
  changeStat(
    "ADD_GRENADE_AS_DANGER",
    [20, 20, 20, 20, 20, 30, 40, 50, 60, 65, 65, 65, 65],
    difficulty,
    botCat
  );
  botCat.MIN_DIST_NOT_TO_THROW_SQR =
    botCat.MIN_DIST_NOT_TO_THROW * botCat.MIN_DIST_NOT_TO_THROW;
  botCat.MIN_THROW_GRENADE_DIST_SQRT =
    botCat.MIN_THROW_GRENADE_DIST * botCat.MIN_THROW_GRENADE_DIST; //This looks like it should be a square root, but default values are the square of MIN_THROW_GRENADE_DIST??
  botCat.RUN_AWAY_SQR = botCat.RUN_AWAY * botCat.RUN_AWAY;
  botCat.ADD_GRENADE_AS_DANGER_SQR =
    botCat.ADD_GRENADE_AS_DANGER * botCat.ADD_GRENADE_AS_DANGER;
  changeStat(
    "CHANCE_RUN_FLASHED_100",
    [0, 0, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
    difficulty,
    botCat
  );
  botCat.GrenadePrecision *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.grenadePrecisionMult;
  botCat.MAX_THROW_POWER *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.grenadeThrowRangeMult;
  botCat.MAX_THROW_POWER >
  globalValues.difficultyConfig.overallDifficultyMultipliers
    .grenadeThrowRangeMax
    ? (botCat.MAX_THROW_POWER =
        globalValues.difficultyConfig.overallDifficultyMultipliers.grenadeThrowRangeMax)
    : null;

  //COVER
  botCat = botDiff.Cover;
  // botCat.STATIONARY_WEAPON_MAX_DIST_TO_USE = 0
  //COVER
  //INVESTIGATE THIS
  //Cover seems bad. The AI's accuracy goes to shit when they're in cover, but no variable seems to actually affect that. Is it hard coded, or am I just missing it?
  //Tried setting everything to zero that wouldn't break the game by being zero. The game was a slideshow, and accuracy was still garbage when in cover. Tried setting the zeroes to 100. Less of a slideshow, but the accuracy still sucked. I'm leaning towards the idea that it's hard coded.
  //That seems to just be part of the offline AI. Fixed as of newer AKI versions.
  botCat.MOVE_TO_COVER_WHEN_TARGET = false;
  botCat.CHECK_COVER_ENEMY_LOOK = false;
  botCat.REWORK_NOT_TO_SHOOT = false;
  botCat.DELETE_POINTS_BEHIND_ENEMIES = true;
  botCat.SHOOT_NEAR_TO_LEAVE = 3;
  //botCat.LOOK_LAST_ENEMY_POS_MOVING = 0.1
  //botCat.LOOK_TO_HIT_POINT_IF_LAST_ENEMY = 0.1
  //botCat.LOOK_LAST_ENEMY_POS_LOOKAROUND = 0.1
  //What does this mean?
  botCat.CHECK_CLOSEST_FRIEND = true;
  botCat.MIN_TO_ENEMY_TO_BE_NOT_SAFE = 15.0;
  //botCat.MIN_TO_ENEMY_TO_BE_NOT_SAFE_SQRT = 0.0;
  // Removed from the assembly || botCat.CAN_LOOK_OUT_WHEN_HOLDING = true;
  //botCat.SIT_DOWN_WHEN_HOLDING = true;
  botCat.MIN_DEFENCE_LEVEL = 3; //15//22 //Unsure exactly what this does either
  botCat.MIN_DIST_TO_ENEMY = 5;
  botCat.DELTA_SEEN_FROM_COVE_LAST_POS = 6;
  botCat.RETURN_TO_ATTACK_AFTER_AMBUSH_MIN = 5;
  botCat.RETURN_TO_ATTACK_AFTER_AMBUSH_MAX = 10;
  //

  //PATROL
  botCat = botDiff.Patrol;
  //PATROL
  //INVESTIGATE THIS
  botCat.CHANGE_WAY_TIME = 15.1;
  botCat.LOOK_TIME_BASE = 5;
  botCat.CHANCE_TO_CHANGE_WAY_0_100 = 70; //30.0;
  botCat.RESERVE_OUT_TIME = 5.0;
  botCat.RESERVE_TIME_STAY = 5.0;
  //
  botCat.VISION_DIST_COEF_PEACE = 0.5;
  //Test this.
  botCat.FRIEND_SEARCH_SEC = 60;

  //HEARING
  botCat = botDiff.Hearing;
  //HEARING
  botCat.LOOK_ONLY_DANGER = false;
  botCat.CHANCE_TO_HEAR_SIMPLE_SOUND_0_1 = 1;
  // botCat.CLOSE_DIST = 250 //25
  // botCat.FAR_DIST = 450 //45
  // botCat.SOUND_DIR_DEEFREE = 30
  //Is this even making a difference? Assuming higher is better for now.
  // botCat.DISPERSION_COEF = 40
  // botCat.DISPERSION_COEF_GUN = 160

  //MIND
  botCat = botDiff.Mind;
  //MIND
  botCat.TIME_LEAVE_MAP = undefined; //50 //Might be the time they disappear, like cultists?
  //The game really doesn't like when Min or Max SHOOTS_TIME is anything but an integer. Unsure why.
  botCat.CAN_THROW_REQUESTS = true;
  botCat.ENEMY_LOOK_AT_ME_ANG = 10;
  //Seems to have nothing to do with talking?
  //..Or does it?
  botCat.TALK_WITH_QUERY = true;
  changeStat("MIN_SHOOTS_TIME", [0, 0, 0, 0, 0, 0], difficulty, botCat);
  changeStat("MAX_SHOOTS_TIME", [0, 0, 0, 0, 0, 0], difficulty, botCat);
  // botCat.MIN_SHOOTS_TIME = 1
  // botCat.MAX_SHOOTS_TIME = 2
  (botCat.MIN_START_AGGRESION_COEF = 1), //Unsure of what these do. Defaults are 1 and 3.
    (botCat.MAX_START_AGGRESION_COEF = 3),
    //Is this the chance they flip you off? Test this.
    //This is the change they flip you off.
    (botCat.CHANCE_FUCK_YOU_ON_CONTACT_100 = 0);
  //INVESTIGATE THIS
  botCat.CAN_STAND_BY = true;
  // botCat.CAN_STAND_BY = false;
  //
  // botCat.DANGER_POINT_CHOOSE_COEF = 0.01
  // botCat.SIMPLE_POINT_CHOOSE_COEF = 0.01
  // botCat.LASTSEEN_POINT_CHOOSE_COEF = 0.01
  botCat.DANGER_EXPIRE_TIME_MIN = 0.4;
  botCat.DANGER_EXPIRE_TIME_MAX = 1.2;
  botCat.PANIC_RUN_WEIGHT = 20.0;
  botCat.PANIC_SIT_WEIGHT = 1.0;
  botCat.PANIC_LAY_WEIGHT = 1.0;
  botCat.PANIC_NONE_WEIGHT = 40.0;
  botCat.PANIC_SIT_WEIGHT_PEACE = 60.0;
  // botCat.CAN_USE_LONG_COVER_POINTS = true;
  //Doesn't affect talking
  botCat.CAN_EXECUTE_REQUESTS = true;
  botCat.DIST_TO_ENEMY_SPOTTED_ON_HIT = 20.0;
  changeStat("MIN_DAMAGE_SCARE", [20, 30, 40, 50, 60, 70], difficulty, botCat);
  botCat.MIN_DAMAGE_SCARE = botCat.MIN_DAMAGE_SCARE * 10;
  botCat.WILL_PERSUE_AXEMAN = false;
  botCat.CHANCE_SHOOT_WHEN_WARN_PLAYER_100 = 100.0;
  //Test this. I assume it means "Heal below this percent", but who knows, it could be flipped around.
  //It does seem to be "Heal below this percent". Good.
  changeStat(
    "PART_PERCENT_TO_HEAL",
    [0.7, 0.75, 0.8, 0.85, 0.9, 0.95],
    difficulty,
    botCat
  );
  //changeStat("ATTACK_IMMEDIATLY_CHANCE_0_100", [0,0,25,45,75,85], difficulty, botCat)
  changeStat(
    "ATTACK_IMMEDIATLY_CHANCE_0_100",
    [35, 45, 55, 65, 75, 80, 80],
    difficulty,
    botCat
  );
  //botCat.AI_POWER_COEF *= 2
  botCat.DOG_FIGHT_OUT = 6;
  botCat.DOG_FIGHT_IN = 5;
  // botCat.SHOOT_INSTEAD_DOG_FIGHT = 9
  botCat.NO_RUN_AWAY_FOR_SAFE = true;
  changeStat("MAX_AGGRO_BOT_DIST", [100, 105, 110], difficulty, botCat);
  botCat.MAX_AGGRO_BOT_DIST_SQR =
    botCat.MAX_AGGRO_BOT_DIST * botCat.MAX_AGGRO_BOT_DIST;
  //botCat.MAX_AGGRO_BOT_DIST = 100
  botCat.TIME_TO_FIND_ENEMY = 60;
  changeStat(
    "CHANCE_TO_RUN_CAUSE_DAMAGE_0_100",
    [70, 60, 50, 40, 30, 25],
    difficulty,
    botCat
  );

  //botCat.HEAL_DELAY_SEC = 5
  //botCat.DIST_TO_ENEMY_YO_CAN_HEAL = 15.0
  botCat.TIME_TO_FORGOR_ABOUT_ENEMY_SEC = 102; //52
  botCat.DEFAULT_ENEMY_USEC = true;
  botCat.DEFAULT_BEAR_BEHAVIOUR = "Attack";
  botCat.DEFAULT_SAVAGE_BEHAVIOUR = "Warn";
  botCat.DEFAULT_USEC_BEHAVIOUR = "Attack";

  //BOSS
  botCat = botDiff.Boss;
  // botCat.TAGILLA_CLOSE_ATTACK_DIST = 5
  // botCat.TAGILLA_LARGE_ATTACK_DIST = 9
  // botCat.TAGILLA_FORCED_CLOSE_ATTACK_DIST = 3
  // botCat.TAGILLA_TIME_TO_PURSUIT_WITHOUT_HITS = 3
  //BOSS

  //CORE
  botCat = botDiff.Core;
  //CORE
  let maxAng =
    globalValues.difficultyConfig.overallDifficultyMultipliers.visibleAngleMax;
  globalValues.difficultyConfig.overallDifficultyMultipliers.visibleAngleMax >
  360
    ? (maxAng = 360)
    : null;
  // config.overallDifficultyMultipliers.visibleAngleMax > 180 ? maxAng = 180 : null //Testing FOV weirdness. 180 might be the actual ingame cap, and things above that behave weirdly on some bots?

  changeStat(
    "VisibleAngle",
    [120, 150, 180, 210, 240, 270],
    difficulty,
    botCat
  );
  botCat.VisibleAngle *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.visibleAngleMult;
  botCat.VisibleAngle > maxAng ? (botCat.VisibleAngle = maxAng) : null;
  // botCat.VisibleAngle /= 2 //Some evidence suggests that visible angle is actually double what it should be ingame, and that super-high values cause errors?
  changeStat(
    "VisibleDistance",
    [115, 125, 135, 145, 155, 165],
    difficulty,
    botCat
  );
  //Making this high can have a dramatic impact on the AI's spotting time, making them take longer to see you. -However, making it super low does not bring the spotting time down to zero.
  botCat.GainSightCoef = 0.15;
  botCat.ScatteringPerMeter = 0.1;
  botCat.ScatteringClosePerMeter = 0.18;
  changeStat(
    "ScatteringPerMeter",
    [0.15, 0.1, 0.085, 0.06, 0.045, 0.03],
    difficulty,
    botCat
  );
  changeStat(
    "ScatteringClosePerMeter",
    [0.21, 0.18, 0.15, 0.12, 0.09, 0.06],
    difficulty,
    botCat
  );
  botCat.ScatteringClosePerMeter = botCat.ScatteringClosePerMeter * 1.3;
  botCat.ScatteringPerMeter = botCat.ScatteringPerMeter * 1;
  botCat.DamageCoeff = 1.0;
  //Set hearing to 10. Seemed to make bots enter 'ambush' mode extremely often, and rarely fought eachother. Suspect they heard movement from massive distance away, got caught in a loop. One moves, spooks the other, other moves into cover, first one hears it, also moves into cover. Forever.
  //Not sure though.
  // changeStat("HearingSense", [1.5,2.0,2.5,3.9,4.5,5.2], difficulty, botCat)
  changeStat(
    "HearingSense",
    [
      0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.92, 0.94, 0.96, 0.98,
      0.98,
    ],
    difficulty,
    botCat
  );
  botCat.HearingSense *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiHearingMult;
  //Check config entry for this one
  botCat.CanGrenade =
    globalValues.difficultyConfig.overallDifficultyMultipliers.allowGrenades;
  //Are there other aiming types? Other bots all seem to use 'normal'.
  botCat.AimingType = "normal";
  // changeStat("AccuratySpeed", [0.32,0.3,0.28,0.26,0.24,0.22], difficulty, botCat)
  changeStat(
    "AccuratySpeed",
    [0.34, 0.33, 0.32, 0.31, 0.29, 0.28, 0.27, 0.26],
    difficulty,
    botCat
  );
  botCat.AccuratySpeed *= 2;
  botCat.WaitInCoverBetweenShotsSec = 0.2;
  //Using multipliers from config
  // botCat.AccuratySpeed *= Math.sqrt(config.overallDifficultyMultipliers.aiAimSpeedMult)
  botCat.VisibleDistance *= Math.sqrt(
    globalValues.difficultyConfig.overallDifficultyMultipliers
      .visibleDistanceMult
  );
  botCat.ScatteringPerMeter *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;
  botCat.ScatteringClosePerMeter *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;

  //SCATTERING
  botCat = botDiff.Scattering;
  //SCATTERING
  //Scattering also doesn't affect shoot to the left / cover accuracy. Of course.
  changeStat(
    "MinScatter",
    [1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.09, 0.08],
    difficulty,
    botCat
  );
  changeStat(
    "WorkingScatter",
    [1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2],
    difficulty,
    botCat
  );
  changeStat(
    "MaxScatter",
    [3, 2.5, 2, 1.5, 1.2, 1, 0.9, 0.8, 0.7, 0.6, 0.5],
    difficulty,
    botCat
  );
  botCat.MinScatter *= 5.04;
  botCat.WorkingScatter *= 2.5;
  botCat.MaxScatter *= 0.9;

  botCat.MinScatter *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;
  botCat.WorkingScatter *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;
  botCat.MaxScatter *=
    globalValues.difficultyConfig.overallDifficultyMultipliers.aiShotSpreadMult;

  //Testing
  botCat.SpeedUp = 0.3;
  botCat.SpeedUpAim = 1.4;
  botCat.SpeedDown = -0.3;
  botCat.ToSlowBotSpeed = 1.5;
  botCat.ToLowBotSpeed = 2.4;
  botCat.ToUpBotSpeed = 3.6;
  botCat.MovingSlowCoef = 1.5;
  botCat.ToLowBotAngularSpeed = 80;
  botCat.ToStopBotAngularSpeed = 40;

  //Is this aimpunch? Doesn't seem to be
  botCat.FromShot = 0.01;

  botCat.Caution = 0.3;

  botCat.HandDamageAccuracySpeed = 1.3;

  botCat.TracerCoef = 1;
  botCat.HandDamageScatteringMinMax = 0.7;
  //botCat.HandDamageAccuracySpeed = 1;
  // changeStat("RecoilControlCoefShootDone", [0.0025,0.0026,0.0027,0.0028,0.0029,0.003], difficulty, botCat)
  // changeStat("RecoilControlCoefShootDoneAuto", [0.00025,0.00026,0.00027,0.00028,0.00029,0.0003], difficulty, botCat)
  // botCat.RecoilControlCoefShootDone *= 5
  botCat.RecoilControlCoefShootDone = 0.0003;
  botCat.RecoilControlCoefShootDoneAuto = 0.00009;
  // changeStat("RecoilControlCoefShootDoneAuto", [0.0001425, 0.000145, 0.0001475, 0.00015, 0.0001525], difficulty, botCat)
  botCat.RecoilControlCoefShootDoneAuto /= 10;
  botCat.DIST_FROM_OLD_POINT_TO_NOT_AIM = 15;
  botCat.DIST_FROM_OLD_POINT_TO_NOT_AIM_SQRT = Math.sqrt(
    botCat.DIST_FROM_OLD_POINT_TO_NOT_AIM
  );
  botCat.RecoilYCoef = 0.0005;
  botCat.RecoilYCoefSppedDown = -0.52;
  botCat.RecoilYMax = 0.5;
  //botCat.RecoilYMax = botCat.RecoilYMax / 6 //Not sure if this does anything? Sure doesn't seem to
  //changeStat("RecoilYMax", [0.5,0.48,0.46,0.44,0.42,0.40], difficulty, botCat)

  //Boss-specific modifications. These should probably take the form of multipliers on existing stats.

  if (botDiff.Scattering.WorkingScatter > botDiff.Scattering.MaxScatter)
    botDiff.Scattering.WorkingScatter =
      (botDiff.Scattering.MaxScatter as number) * 0.9;
  if (botDiff.Scattering.MinScatter > botDiff.Scattering.WorkingScatter)
    botDiff.Scattering.MinScatter =
      (botDiff.Scattering.WorkingScatter as number) * 0.9;

  //Squares and square roots
  //THIS IS AN INCOMPLETE LIST
  botDiff.Shoot.FAR_DIST_ENEMY_SQR =
    (botDiff.Shoot.FAR_DIST_ENEMY as number) *
    (botDiff.Shoot.FAR_DIST_ENEMY as number);
  botDiff.Grenade.MIN_DIST_NOT_TO_THROW_SQR =
    (botDiff.Grenade.MIN_DIST_NOT_TO_THROW as number) *
    (botDiff.Grenade.MIN_DIST_NOT_TO_THROW as number);
  botDiff.Grenade.MIN_THROW_GRENADE_DIST_SQRT =
    (botDiff.Grenade.MIN_THROW_GRENADE_DIST as number) *
    (botDiff.Grenade.MIN_THROW_GRENADE_DIST as number); //This looks like it should be a square root: but default values are the square of MIN_THROW_GRENADE_DIST??
  botDiff.Grenade.RUN_AWAY_SQR =
    (botDiff.Grenade.RUN_AWAY as number) * (botDiff.Grenade.RUN_AWAY as number);
  botDiff.Grenade.ADD_GRENADE_AS_DANGER_SQR =
    (botDiff.Grenade.ADD_GRENADE_AS_DANGER as number) *
    (botDiff.Grenade.ADD_GRENADE_AS_DANGER as number);
  // botDiff.Mind.MAX_AGGRO_BOT_DIST_SQR = (botDiff.Mind.MAX_AGGRO_BOT_DIST as number) * (botDiff.Mind.MAX_AGGRO_BOT_DIST as number)
};

// const getTotal = (compared: any = 0, low: any = 0, high: any = 0) => {
//     switch (true) {
//         case typeof low === "object":
//         case typeof high === "object":
//             return 0
//         case typeof low === "boolean" || typeof high === "boolean":
//             if (high === compared) return 5
//             return 0
//         case typeof low === "number" || typeof high === "number":
//             if (high > low) {

//                 switch (true) {
//                     case compared > high:
//                         return 15
//                     case compared === high:
//                         return 10
//                     case compared > low:
//                         return 10 * ((compared - low) / low)
//                     default:
//                         return 0
//                 }
//             }
//             switch (true) {// 2 3 1
//                 case compared < low:
//                     return 15
//                 case compared === low:
//                     return 10
//                 case compared < high:
//                     return 10 * ((high - compared) / compared)
//                 default:
//                     return 0
//             }
//         default:
//             return 0
//     }
// }

// export const runCompare = (compared: Difficulty, easy: Difficulty, hard: Difficulty) => {
//     let total = 0;
//     Object.keys(easy).forEach((difficultyKey) => {
//         const updatedKeyValue = {};
//         Object.keys(easy[difficultyKey]).forEach((subType) => {
//             const easyValue = easy[difficultyKey][subType];
//             const hardValue = hard[difficultyKey][subType];
//             const compValue = compared[difficultyKey][subType];
//             if (easyValue === hardValue) return
//             const value = getTotal(compValue, easyValue, hardValue)
//             // console.log(value, compValue, easyValue, hardValue)
//             total += value
//         });
//         const numberChanged = Object.keys(updatedKeyValue).length
//         if (numberChanged) {
//             compared[difficultyKey + " " + numberChanged + "/" + Object.keys(easy[difficultyKey]).length] = updatedKeyValue;
//         }
//     });
//     return total
// }

// const getTotal = (compared: boolean | number | string[] = 0, low: boolean | number | string[] = 0, high: boolean | number | string[] = 0) => {
//     switch (true) {
//         case typeof low === "object":
//         case typeof high === "object":
//             return 0
//         case typeof low === "boolean" || typeof high === "boolean":
//             if (high === compared) return 5
//             return 0
//         case typeof low === "number" || typeof high === "number":
//             if (high > low) return (((compared as number) - (low as number)) / ((high as number) - (low as number))) * 5
//             return (((compared as number) - (high as number)) / ((low as number) - (high as number))) * 5
//         default:
//             return 0
//     }
// }

// export const runCompare = (compared: Difficulty, easy: Difficulty, hard: Difficulty) => {
//     let total = 0;
//     Object.keys(easy).forEach((difficultyKey) => {
//         const updatedKeyValue = {};
//         Object.keys(easy[difficultyKey]).forEach((subType) => {
//             const easyValue = easy[difficultyKey][subType];
//             const hardValue = hard[difficultyKey][subType];
//             const compValue = compared[difficultyKey][subType];
//             if (easyValue === hardValue) return
//             const value = getTotal(compValue, easyValue, hardValue)
//             console.log(value, compValue, easyValue, hardValue)
//             total += value
//         });
//         const numberChanged = Object.keys(updatedKeyValue).length
//         if (numberChanged) {
//             compared[difficultyKey + " " + numberChanged + "/" + Object.keys(easy[difficultyKey]).length] = updatedKeyValue;
//         }
//     });
//     console.log(total);
// }

// import { Difficulty } from "@spt-aki/models/eft/common/tables/IBotType"

// const getWeightedValue = (level: number, lo?: boolean | number | string[], hi?: boolean | number | string[],) => {
//     const min = 1
//     const max = 60
//     const mid = ((max - min) / 2)
//     let fractionalPercentage = Math.round((level / (max - min)) * 100) / 100
//     fractionalPercentage > 1 ? 1 : fractionalPercentage

//     let low, med, high
//     switch (true) {
//         case typeof lo === "object":
//         case typeof hi === "object":
//             return []
//         case typeof lo === "boolean" || typeof hi === "boolean":
//             low = lo !== undefined ? lo : !hi
//             high = hi !== undefined ? hi : !lo

//             med = level > mid ? high : low

//             return [low, med, high]
//         case (lo as number) % 1 === 0 || (hi as number) % 1 === 0:
//             high = hi !== undefined ? hi : 0
//             low = lo !== undefined ? lo : 0
//             if (high > low) {
//                 med = low + ((high - low) * fractionalPercentage)
//             } else { med = low - ((low - high) * fractionalPercentage) }
//             return [low, Math.round(med), high]
//         case (lo as number) % 1 !== 0 || (hi as number) % 1 !== 0:
//             low = lo !== undefined ? lo : 0
//             high = hi !== undefined ? hi : 0
//             if (high > low) {
//                 med = low + ((high - low) * fractionalPercentage)
//             } else { med = low - ((low - high) * fractionalPercentage) }

//             return [low, Math.round(med * 100) / 100, high]
//         default:
//             med = "no Match"
//             return [lo, med, hi]
//     }
// }
// let bots = {}

// const runCompare = (easy: Difficulty, hard: Difficulty, level: number) => {
//     const compared = {};
//     Object.keys(easy).forEach((difficultyKey) => {
//         const updatedKeyValue = {};
//         Object.keys(easy[difficultyKey]).forEach((subType) => {
//             const easyValue = easy[difficultyKey][subType];
//             const hardValue = hard[difficultyKey][subType];
//             if (easyValue === hardValue) return
//             const [low, med, high] = getWeightedValue(level, easyValue, hardValue)
//             if (low !== undefined && med !== undefined && high !== undefined) {
//                 updatedKeyValue[subType] = { low, high, med };
//             }
//         });
//         const numberChanged = Object.keys(updatedKeyValue).length
//         if (numberChanged) {
//             compared[difficultyKey + " " + numberChanged + "/" + Object.keys(easy[difficultyKey]).length] = updatedKeyValue;
//         }
//     });
//     console.log(JSON.stringify(compared));
// }

// const easy = bots?.types?.assault?.difficulty?.normal;
// const hardest = bots?.types?.exusec?.difficulty?.normal

// runCompare(easy, hardest, 30)
