import { IDifficultyCategories } from "@spt/models/eft/common/tables/IBotType";
import { IBots } from "@spt/models/spt/bots/IBots";
import { saveToFile } from "../utils";

export default function marksmanChanges(bots: IBots) {
  // const bossBoreSniperDifficulty = bots.types.bossboarsniper.difficulty;
  // saveToFile(bots.types.marksman.difficulty, "marksmanDifficulty.json");
  for (const diff in bots.types.marksman.difficulty) {
    // const difficultySettings: IDifficultyCategories =
    //   bossBoreSniperDifficulty[diff];
    // if (!bossBoreSniperDifficulty[diff]) continue;
    // for (const key in difficultySettings) {
    //   const boreSniperSubSettings = difficultySettings[key];
    //   if (!boreSniperSubSettings || !bots.types.marksman.difficulty[diff][key])
    //     continue;

    //   bots.types.marksman.difficulty[diff][key] = {
    //     ...bots.types.marksman.difficulty[diff][key],
    //     ...boreSniperSubSettings,
    //   };
    // }

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Core = {
      ...bots.types.marksman.difficulty[diff].Core,
      VisibleAngle: 300,
      VisibleDistance: 245,
      ScatteringPerMeter: 0.1,
      HearingSense: 2.85,
    };

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Mind = {
      ...bots.types.marksman.difficulty[diff].Mind,
      BULLET_FEEL_DIST: 360,
      CHANCE_FUCK_YOU_ON_CONTACT_100: 10,
    };

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Hearing = {
      ...bots.types.marksman.difficulty[diff].Hearing,
      CHANCE_TO_HEAR_SIMPLE_SOUND_0_1: 0.7,
      DISPERSION_COEF: 3.6,
      CLOSE_DIST: 10,
      FAR_DIST: 30,
    };
  }
  // saveToFile(bots.types.marksman.difficulty, "marksmanDifficulty2.json");
}
