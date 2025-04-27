import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IBotBase } from "@spt/models/eft/common/tables/IBotBase";
import { BotGenerationCacheService } from "@spt/services/BotGenerationCacheService";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import config from "../../config/difficultyConfig.json";
import difficultyConfig from "./difficulty.json";

export type Role = {
  Role: string;
  BotDifficulty: "easy" | "normal" | "hard" | "impossible";
};
export class globalValues {
  public static Logger: ILogger;
  public static database: IDatabaseTables;
  public static baseAI: IBotBase;
  public static config = config;
  public static difficultyConfig = difficultyConfig;
  public static botGenerationCacheService: BotGenerationCacheService;
  public static RaidStartTime: number;
  public static RaidMap:
    | "bigmap"
    | "develop"
    | "factory4_day"
    | "factory4_night"
    | "hideout"
    | "interchange"
    | "laboratory"
    | "lighthouse"
    | "privatearea"
    | "rezervbase"
    | "shoreline"
    | "suburbs"
    | "tarkovstreets"
    | "terminal"
    | "town"
    | "woods";

  public static scavAlternates = [
    ...difficultyConfig.bots.midLevelAIs,
    // ...difficultyConfig.bots.highLevelAIs,
  ];

  public static pmcAlternates = [
    ...difficultyConfig.bots.midLevelAIs,
    ...difficultyConfig.bots.highLevelAIs,
  ];

  public static marksmanAlternates = [
    "followergluharsnipe",
    "followerbirdeye",
    "bosskojaniy",
  ];

  public static assaultRoleList: Role[] = [
    {
      Role: "assault",
      BotDifficulty: "easy",
    },
    {
      Role: "assault",
      BotDifficulty: "normal",
    },
    {
      Role: "assault",
      BotDifficulty: "hard",
    },
    {
      Role: "cursedAssault",
      BotDifficulty: "easy",
    },
    {
      Role: "assault",
      BotDifficulty: "impossible",
    },
    {
      Role: "cursedAssault",
      BotDifficulty: "normal",
    },
    {
      Role: "cursedAssault",
      BotDifficulty: "hard",
    },
    {
      Role: "cursedAssault",
      BotDifficulty: "impossible",
    },
  ];

  public static bearRoleList: Role[] = [
    {
      Role: "pmcBot",
      BotDifficulty: "easy",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "normal",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "hard",
    },
    {
      Role: "pmcBEAR",
      BotDifficulty: "easy",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "impossible",
    },
    {
      Role: "pmcBEAR",
      BotDifficulty: "normal",
    },
    {
      Role: "pmcBEAR",
      BotDifficulty: "hard",
    },
    {
      Role: "pmcBEAR",
      BotDifficulty: "impossible",
    },
  ];

  public static usecRoleList: Role[] = [
    {
      Role: "pmcBot",
      BotDifficulty: "easy",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "normal",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "hard",
    },
    {
      Role: "pmcUSEC",
      BotDifficulty: "easy",
    },
    {
      Role: "pmcBot",
      BotDifficulty: "impossible",
    },
    {
      Role: "pmcUSEC",
      BotDifficulty: "normal",
    },
    {
      Role: "pmcUSEC",
      BotDifficulty: "hard",
    },
    {
      Role: "pmcUSEC",
      BotDifficulty: "impossible",
    },
  ];

  public static roleCase: object = {
    arenafighter: "arenaFighter",
    arenafighterevent: "arenaFighterEvent",
    assault: "assault",
    exusec: "exUsec",
    marksman: "marksman",
    pmcbot: "pmcBot",
    sectantpriest: "sectantPriest",
    sectantwarrior: "sectantWarrior",
    assaultgroup: "assaultGroup",
    bossbully: "bossBully",
    bossboar: "bossBoar",
    bossboarsniper: "bossBoarSniper",
    bosstagilla: "bossTagilla",
    bossgluhar: "bossGluhar",
    bosskilla: "bossKilla",
    bosskolontay: "bossKolontay",
    bosskojaniy: "bossKojaniy",
    bosssanitar: "bossSanitar",
    bosspartisan: "bossPartisan",
    bosszryachiy: "bossZryachiy",
    followerbully: "followerBully",
    followerboar: "followerBoar",
    followergluharassault: "followerGluharAssault",
    followergluharscout: "followerGluharScout",
    followergluharsecurity: "followerGluharSecurity",
    followergluharsnipe: "followerGluharSnipe",
    followerkojaniy: "followerKojaniy",
    followerkolontayassault: "followerKolontayAssault",
    followerkolontaysecurity: "followerKolontaySecurity",
    followersanitar: "followerSanitar",
    followertagilla: "followerTagilla",
    cursedassault: "cursedAssault",
    skier: "skier",
    usec: "pmcUSEC",
    bear: "pmcBEAR",
    bosstest: "bossTest",
    followertest: "followerTest",
    gifter: "gifter",
    bossknight: "bossKnight",
    followerbigpipe: "followerBigPipe",
    followerbirdeye: "followerBirdEye",
    test: "test",
    followerzryachiy: "followerZryachiy",
  };
}
