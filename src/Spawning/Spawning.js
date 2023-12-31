"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWaves = void 0;
const spawnConfig_json_1 = require("../../config/spawnConfig.json");
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const buildWaves = (container) => {
    // Get Logger
    const logger = container.resolve("WinstonLogger");
    logger.info("MOAR: Successfully enabled, may the bots ever be in your favour!\n");
    const configServer = container.resolve("ConfigServer");
    const pmcConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.PMC);
    const botConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.BOT);
    const locationConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
    const databaseServer = container.resolve("DatabaseServer");
    // Get all the in-memory json found in /assets/database
    const { bots, locations } = databaseServer.getTables();
    const { bigmap: customs, factory4_day: factoryDay, factory4_night: factoryNight, interchange, laboratory, lighthouse, rezervbase, shoreline, tarkovstreets, woods } = locations;
    const originalMapList = [
        "bigmap",
        "factory4_day",
        "factory4_night",
        "interchange",
        "laboratory",
        "lighthouse",
        "rezervbase",
        "shoreline",
        "tarkovstreets",
        "woods"
    ];
    const locationList = [
        customs,
        factoryDay,
        factoryNight,
        interchange,
        laboratory,
        lighthouse,
        rezervbase,
        shoreline,
        tarkovstreets,
        woods
    ];
    const pmcCountList = [
        8,
        5,
        5,
        8,
        8,
        8,
        8,
        8,
        10,
        8 // woods
    ];
    const scavWaveCountList = [
        20,
        9,
        9,
        24,
        0,
        16,
        18,
        25,
        30,
        24 // woods
    ];
    const configLocations = [
        "customs",
        "factoryDay",
        "factoryNight",
        "interchange",
        "laboratory",
        "lighthouse",
        "rezervbase",
        "shoreline",
        "tarkovstreets",
        "woods"
    ];
    const bossStringList = [
        "bossBully",
        "bossTagilla",
        "bossGluhar",
        "bossKilla",
        "bossKojaniy",
        "bossSanitar"
    ];
    locationConfig.customWaves = { boss: {}, normal: {} };
    if (spawnConfig_json_1.pmcsAlwaysHostile)
        pmcConfig.chanceSameSideIsHostilePercent = 100;
    if (spawnConfig_json_1.preventPMCChatter) {
        // The below is a code snippet pulled almost straight from the wicked modder PreyToLive
        const botDifficulty = [
            "easy",
            "normal",
            "hard",
            "impossible"
        ];
        botDifficulty.forEach(difficulty => {
            bots.types.bear.difficulty[difficulty].Mind.CAN_TALK = false;
            bots.types.bear.difficulty[difficulty].Mind.CAN_THROW_REQUESTS = false;
            bots.types.bear.difficulty[difficulty].Mind.TALK_WITH_QUERY = false;
            bots.types.pmcbot.difficulty[difficulty].Mind.CAN_TALK = false;
            bots.types.pmcbot.difficulty[difficulty].Mind.CAN_THROW_REQUESTS = false;
            bots.types.pmcbot.difficulty[difficulty].Mind.TALK_WITH_QUERY = false;
            bots.types.usec.difficulty[difficulty].Mind.CAN_TALK = false;
            bots.types.usec.difficulty[difficulty].Mind.CAN_THROW_REQUESTS = false;
            bots.types.usec.difficulty[difficulty].Mind.TALK_WITH_QUERY = false;
        });
    }
    if (spawnConfig_json_1.pmcsHaveEOD) {
        bots.base.Info.MemberCategory = 2;
    }
    // ============================================================
    // experimental
    // const distNotToGroup = 5
    // bots.core.DIST_NOT_TO_GROUP = distNotToGroup
    // bots.core.DIST_NOT_TO_GROUP_SQR = distNotToGroup * distNotToGroup
    // ============================================================
    // Disable all scav conversion
    pmcConfig.convertIntoPmcChance = {
        assault: { min: 0, max: 0 },
        cursedassault: { min: 0, max: 0 },
        pmcbot: { min: 0, max: 0 },
        exusec: { min: 0, max: 0 },
        arenafighter: { min: 0, max: 0 },
        arenafighterevent: { min: 0, max: 0 },
        crazyassaultevent: { min: 0, max: 0 }
    };
    botConfig.presetBatch["sptbear"] = spawnConfig_json_1.defaultMaxBotCap;
    botConfig.presetBatch["sptusec"] = spawnConfig_json_1.defaultMaxBotCap;
    botConfig["botGenerationBatchSizePerType"] = spawnConfig_json_1.defaultMaxBotCap;
    for (let index = 0; index < locationList.length; index++) {
        const mapSettingsList = Object.keys(spawnConfig_json_1.mapSettings);
        const map = mapSettingsList[index];
        // Disable Bosses
        if (spawnConfig_json_1.disableBosses && !!locationList[index].base?.BossLocationSpawn)
            locationList[index].base.BossLocationSpawn = [];
        locationList[index].base = {
            ...locationList[index].base, ...{
                "NewSpawn": false,
                "OcculsionCullingEnabled": true,
                "OfflineNewSpawn": false,
                "OfflineOldSpawn": true,
                "OldSpawn": true,
            }
        };
        locationList[index].base.BotStart = 0;
        if (locationList[index].base.BotStop < (locationList[index].base.EscapeTimeLimit * 60)) {
            locationList[index].base.BotStop = locationList[index].base.EscapeTimeLimit * 60;
        }
        // No Zone Delay
        if (spawnConfig_json_1.noZoneDelay) {
            const zonesWithoutDelay = locationList[index].base.SpawnPointParams.map((spawn) => ({ ...spawn, DelayToCanSpawnSec: 4 }));
            locationList[index].base.SpawnPointParams = zonesWithoutDelay;
        }
        // Reduced Zone Delay
        if (!spawnConfig_json_1.noZoneDelay && spawnConfig_json_1.reducedZoneDelay) {
            const zonesWithLessDelay = locationList[index].base.SpawnPointParams.map((spawn) => ({ ...spawn, DelayToCanSpawnSec: spawn.DelayToCanSpawnSec > 20 ? Math.round(spawn.DelayToCanSpawnSec / 10) : spawn.DelayToCanSpawnSec }));
            locationList[index].base.SpawnPointParams = zonesWithLessDelay;
        }
        // Snipers
        const snipers = shuffle(locationList[index].base.waves.filter(({ WildSpawnType: type }) => type === "marksman")
            .map((wave) => ({
            ...wave,
            slots_min: 0,
            ...(spawnConfig_json_1.sniperBuddies && wave.slots_max < 2) ? { slots_max: 2 } : {}
        })));
        if (snipers.length) {
            locationList[index].base.MinMaxBots = [{ WildSpawnType: "marksman", max: snipers.length * 5, min: snipers.length }];
        }
        const scavZones = [...new Set([...locationList[index].base.SpawnPointParams]
                .filter(({ Categories, Sides, BotZoneName }) => !!BotZoneName && Sides.includes("Savage") && Categories.includes("Bot") && !Categories.includes("Boss"))
                .map(({ BotZoneName }) => BotZoneName))];
        const pmcZones = [...new Set([...locationList[index].base.SpawnPointParams]
                .filter(({ Categories, BotZoneName }) => !!BotZoneName && Categories.includes("Player"))
                .map(({ BotZoneName }) => BotZoneName))];
        const mapPulledLocations = [...locationList[index].base.waves]
            .filter(({ WildSpawnType, SpawnPoints }) => WildSpawnType === "assault" && !!SpawnPoints)
            .map(({ SpawnPoints }) => SpawnPoints);
        const sniperLocations = [...new Set(snipers.map(({ SpawnPoints }) => SpawnPoints))];
        const combinedPmcScavOpenZones = shuffle([...new Set([...scavZones, ...pmcZones, ...mapPulledLocations])])
            .filter((location) => !sniperLocations.includes(location));
        const { EscapeTimeLimit, maxBotCap, scavWaveStartRatio, scavWaveMultiplier, scavWaveCount, 
        // additionalScavsPerWave ,
        pmcWaveStartRatio, pmcWaveMultiplier, pmcCount, maxBotPerZone, pmcSpecialZones = [], scavSpecialZones } = spawnConfig_json_1.mapSettings?.[map] || {};
        // Set per map EscapeTimeLimit
        if (EscapeTimeLimit) {
            locationList[index].base.EscapeTimeLimit = EscapeTimeLimit;
            locationList[index].base.exit_access_time = EscapeTimeLimit + 1;
        }
        // Set default or per map maxBotCap
        if (spawnConfig_json_1.defaultMaxBotCap || maxBotCap) {
            const capToSet = maxBotCap || spawnConfig_json_1.defaultMaxBotCap;
            locationList[index].base.BotMax = capToSet;
            botConfig.maxBotCap[originalMapList[index]] = capToSet;
        }
        // Make all zones open for scav/pmc spawns
        if (spawnConfig_json_1.allOpenZones) {
            if (combinedPmcScavOpenZones.length > 0) {
                locationConfig.openZones[`${originalMapList[index]}`] = combinedPmcScavOpenZones;
                locationList[index].base.OpenZones = combinedPmcScavOpenZones.join(",");
            }
        }
        // Adjust botZone quantity
        if ((maxBotPerZone || spawnConfig_json_1.defaultMaxBotPerZone) && locationList[index].base.MaxBotPerZone < (maxBotPerZone || spawnConfig_json_1.defaultMaxBotPerZone)) {
            locationList[index].base.MaxBotPerZone = maxBotPerZone || spawnConfig_json_1.defaultMaxBotPerZone;
        }
        const timeLimit = locationList[index].base.EscapeTimeLimit * 60;
        // Pmcs
        const pmcWaveStart = pmcWaveStartRatio || spawnConfig_json_1.defaultPmcStartWaveRatio;
        const pmcWaveMulti = pmcWaveMultiplier || spawnConfig_json_1.defaultPmcWaveMultiplier;
        const pmcCountPerSide = Math.round(((pmcCount || pmcCountList[index]) * pmcWaveMulti) / 2);
        const middleIndex = Math.ceil(pmcSpecialZones.length / 2);
        const firstHalf = pmcSpecialZones.splice(0, middleIndex);
        const secondHalf = pmcSpecialZones.splice(-middleIndex);
        const randomBoolean = Math.random() > 0.5;
        const bearWaves = waveBuilder(pmcCountPerSide, timeLimit, pmcWaveStart, "sptbear", 0.4, true, spawnConfig_json_1.defaultGroupMaxPMC, combinedPmcScavOpenZones, randomBoolean ? firstHalf : secondHalf, 15, true);
        const usecWaves = waveBuilder(pmcCountPerSide, timeLimit, pmcWaveStart, "sptusec", 0.4, true, spawnConfig_json_1.defaultGroupMaxPMC, combinedPmcScavOpenZones, randomBoolean ? secondHalf : firstHalf, 5, true);
        // Scavs
        const scavWaveStart = scavWaveStartRatio || spawnConfig_json_1.defaultScavStartWaveRatio;
        const scavWaveMulti = scavWaveMultiplier || spawnConfig_json_1.defaultScavWaveMultiplier;
        const scavTotalWaveCount = Math.round((scavWaveCount || scavWaveCountList[index]) * scavWaveMulti);
        const scavWaves = waveBuilder(scavTotalWaveCount, timeLimit, scavWaveStart, "assault", 0.4, false, spawnConfig_json_1.defaultGroupMaxScav, combinedPmcScavOpenZones, scavSpecialZones);
        if (spawnConfig_json_1.debug) {
            let total = 0;
            let totalscav = 0;
            bearWaves.forEach(({ slots_max }) => total += slots_max);
            usecWaves.forEach(({ slots_max }) => total += slots_max);
            scavWaves.forEach(({ slots_max }) => totalscav += slots_max);
            console.log(configLocations[index]);
            console.log("Pmcs:", total);
            console.log("Scavs:", totalscav, "\n");
        }
        const finalSniperWaves = snipers?.map(({ ...rest }, snipKey) => ({
            ...rest,
            number: snipKey,
            time_min: snipKey * 120,
            time_max: (snipKey * 120) + 120
        }));
        locationList[index].base.waves = [...finalSniperWaves, ...scavWaves, ...bearWaves, ...usecWaves].sort(({ number: a }, { number: b }) => a - b);
    }
    // CreateBossList
    const bosses = {};
    for (let indx = 0; indx < locationList.length; indx++) {
        const location = locationList[indx];
        const defaultBossSettings = spawnConfig_json_1.mapSettings?.[configLocations[indx]]?.defaultBossSettings;
        // Sets bosses spawn chance from settings
        if (location?.base?.BossLocationSpawn && !spawnConfig_json_1.disableBosses && defaultBossSettings && Object.keys(defaultBossSettings)?.length) {
            const filteredBossList = Object.keys(defaultBossSettings).filter(name => defaultBossSettings[name]?.BossChance !== undefined);
            if (filteredBossList?.length) {
                filteredBossList.forEach(bossName => {
                    location.base.BossLocationSpawn = location.base.BossLocationSpawn.map(boss => ({
                        ...boss, ...boss.BossName === bossName ? { BossChance: defaultBossSettings[bossName].BossChance } : {}
                    }));
                });
            }
        }
        const filteredBosses = location.base.BossLocationSpawn?.filter(({ BossName }) => bossStringList.includes(BossName));
        if (!spawnConfig_json_1.disableBosses && (spawnConfig_json_1.bossOpenZones || spawnConfig_json_1.mainBossChanceBuff)) {
            location.base?.BossLocationSpawn?.forEach((boss, key) => {
                if (locationList[indx].base.OpenZones && bossStringList.includes(boss.BossName)) {
                    location.base.BossLocationSpawn[key] =
                        {
                            ...boss,
                            ...spawnConfig_json_1.bossOpenZones ? { BossZone: locationList[indx].base.OpenZones } : {},
                            ...boss.BossChance !== 0 ? { BossChance: Math.round(boss.BossChance + spawnConfig_json_1.mainBossChanceBuff) } : {}
                        };
                }
            });
        }
        //Add each boss from each map to bosses object
        if (!spawnConfig_json_1.disableBosses && filteredBosses?.length) {
            for (let index = 0; index < filteredBosses.length; index++) {
                const boss = filteredBosses[index];
                if (!bosses[boss.BossName] || (bosses[boss.BossName] && bosses[boss.BossName].BossChance < boss.BossChance)) {
                    bosses[boss.BossName] = { ...boss };
                }
            }
        }
        if (spawnConfig_json_1.randomRaiderGroup) {
            const raiderWave = buildBossBasedWave(spawnConfig_json_1.randomRaiderGroupChance, "1,2,2,2,3", "pmcBot", "pmcBot", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit);
            location.base.BossLocationSpawn.push(raiderWave);
        }
        if (spawnConfig_json_1.randomRogueGroup) {
            const rogueWave = buildBossBasedWave(spawnConfig_json_1.randomRogueGroupChance, "1,2,2,2,3", "exUsec", "exUsec", locationList[indx].base.OpenZones, locationList[indx].base.EscapeTimeLimit);
            location.base.BossLocationSpawn.push(rogueWave);
        }
    }
    if (spawnConfig_json_1.bossInvasion && !spawnConfig_json_1.disableBosses) {
        if (spawnConfig_json_1.bossInvasionSpawnOverride) {
            bossStringList.forEach((bossName) => {
                bosses[bossName].BossChance = spawnConfig_json_1.bossInvasionSpawnOverride;
            });
        }
        for (let key = 0; key < locationList.length; key++) {
            //Gather bosses to avoid duplicating.
            const duplicateBosses = locationList[key].base.BossLocationSpawn
                .filter(({ BossName }) => bossStringList.includes(BossName))
                .map(({ BossName }) => BossName);
            //Build bosses to add
            const bossesToAdd = shuffle(Object.values(bosses)).filter(({ BossName }) => !duplicateBosses.includes(BossName)).map((boss, j) => ({ ...boss, BossZone: locationList[key].base.OpenZones, ...spawnConfig_json_1.gradualBossInvasion ? { Time: (j * 20) + 1 } : {} }));
            // UpdateBosses
            locationList[key].base.BossLocationSpawn = [...locationList[key].base.BossLocationSpawn, ...bossesToAdd];
        }
    }
    // for (let key = 0; key < locationList.length; key++) {
    //     if (locationList[key].base?.BossLocationSpawn) {
    //         locationList[key].base?.BossLocationSpawn.sort(({ Time: a }, { Time: b }) => a - b)
    //     }
    // }
    if (spawnConfig_json_1.debug) {
        spawnConfig_json_1.sniperBuddies && logger.logWithColor("sniperBuddies: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.noZoneDelay && logger.logWithColor("noZoneDelay: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.reducedZoneDelay && logger.logWithColor("reducedZoneDelay: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.allOpenZones && logger.logWithColor("allOpenZones: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.preventPMCChatter && logger.logWithColor("preventPMCChatter: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.pmcsAlwaysHostile && logger.logWithColor("pmcsAlwaysHostile: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.pmcsHaveEOD && logger.logWithColor("pmcsHaveEOD: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.randomRaiderGroup && logger.logWithColor("randomRaiderGroup: Enabled", LogTextColor_1.LogTextColor.WHITE);
        spawnConfig_json_1.randomRogueGroup && logger.logWithColor("randomRogueGroup: Enabled", LogTextColor_1.LogTextColor.WHITE);
        if (spawnConfig_json_1.disableBosses) {
            logger.logWithColor("disableBosses: Enabled", LogTextColor_1.LogTextColor.WHITE);
        }
        else {
            spawnConfig_json_1.bossOpenZones && logger.logWithColor("bossOpenZones: Enabled", LogTextColor_1.LogTextColor.WHITE);
            spawnConfig_json_1.bossInvasion && logger.logWithColor("bossInvasion: Enabled", LogTextColor_1.LogTextColor.WHITE);
            spawnConfig_json_1.gradualBossInvasion && logger.logWithColor("gradualBossInvasion: Enabled", LogTextColor_1.LogTextColor.WHITE);
        }
    }
};
exports.buildWaves = buildWaves;
function waveBuilder(totalWaves, timeLimit, waveStart, wildSpawnType, difficulty, isPlayer, maxSlots, combinedZones = [], specialZones = [], offset, moreGroups) {
    const averageTime = timeLimit / totalWaves;
    const firstHalf = Math.round(averageTime * (1 - waveStart));
    const secondHalf = Math.round(averageTime * (1 + waveStart));
    let timeStart = offset || 0;
    const waves = [];
    while (waves.length < totalWaves || specialZones.length > 0) {
        const stage = waves.length < Math.round(totalWaves * 0.5) ? firstHalf : secondHalf;
        const min = !offset && waves.length < 1 ? 0 : timeStart;
        const max = !offset && waves.length < 1 ? 0 : timeStart + 10;
        if (waves.length >= 1 || offset)
            timeStart = timeStart + stage;
        const BotPreset = getDifficulty(difficulty);
        const slotMax = Math.round((moreGroups ? Math.random() : Math.random() * Math.random()) * maxSlots) || 1;
        waves.push({
            BotPreset,
            BotSide: "Savage",
            SpawnPoints: getZone(specialZones, combinedZones, waves.length >= totalWaves),
            isPlayers: isPlayer,
            slots_max: slotMax,
            slots_min: 0,
            time_min: min,
            time_max: max,
            WildSpawnType: wildSpawnType,
            number: waves.length
        });
    }
    return waves;
}
const getZone = (specialZones, combinedZones, specialOnly) => {
    if (!specialOnly && combinedZones.length)
        return combinedZones[Math.round((combinedZones.length - 1) * Math.random())];
    if (specialZones.length)
        return specialZones.pop();
    return "";
};
function getDifficulty(diff) {
    const randomNumb = Math.random() + diff;
    switch (true) {
        case randomNumb < 0.55:
            return "easy";
        case randomNumb < 1.40:
            return "normal";
        case randomNumb < 1.85:
            return "hard";
        default:
            return "impossible";
    }
}
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
function buildBossBasedWave(BossChance, BossEscortAmount, BossEscortType, BossName, BossZone, raidTime) {
    return ({
        BossChance,
        BossDifficult: "normal",
        BossEscortAmount,
        BossEscortDifficult: "normal",
        BossEscortType,
        BossName,
        BossPlayer: false,
        BossZone,
        RandomTimeSpawn: false,
        Supports: null,
        Time: Math.round(Math.random() * (raidTime * 5)),
        TriggerId: "",
        TriggerName: ""
    });
}
