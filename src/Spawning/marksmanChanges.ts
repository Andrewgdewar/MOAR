import { IDifficultyCategories } from "@spt/models/eft/common/tables/IBotType";
import { IBots } from "@spt/models/spt/bots/IBots";
import { saveToFile } from "../utils";

export default function marksmanChanges(bots: IBots) {
  const bossBoreSniperDifficulty = bots.types.marksman.difficulty;
  //   saveToFile(bots.types.bossboarsniper.difficulty, "marksmanDifficulty.json");
  for (const diff in bossBoreSniperDifficulty) {
    const difficultySettings: IDifficultyCategories =
      bossBoreSniperDifficulty[diff];

    for (const key in difficultySettings) {
      const boreSniperSubSettings = difficultySettings[key];
      bots.types.marksman.difficulty[diff][key] = {
        ...bots.types.marksman.difficulty[diff][key],
        ...boreSniperSubSettings,
      };
    }

    (bots.types.marksman.difficulty[diff] as IDifficultyCategories).Core = {
      ...bots.types.marksman.difficulty[diff].Core,
      VisibleAngle: 270,
      VisibleDistance: 245,
      ScatteringPerMeter: 0.12,
    };
  }
  //   saveToFile(bots.types.marksman.difficulty, "marksmanDifficulty2.json");
}
