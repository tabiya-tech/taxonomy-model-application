import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";

export interface TaxonomyGroup {
  locale: ModelInfoTypes.Locale;
  models: ModelInfoTypes.ModelInfo[];
  latestModel: ModelInfoTypes.ModelInfo;
}

/**
 * Groups the given models by their locale (locale.UUID).
 * Within a group the models are sorted by createdAt descending, so the first one is the latest.
 * The groups themselves are sorted by the createdAt of their latest model, descending.
 */
export function groupModelsByLocale(models: ModelInfoTypes.ModelInfo[]): TaxonomyGroup[] {
  const modelsByLocaleUUID = new Map<string, ModelInfoTypes.ModelInfo[]>();
  for (const model of models) {
    const group = modelsByLocaleUUID.get(model.locale.UUID);
    if (group) {
      group.push(model);
    } else {
      modelsByLocaleUUID.set(model.locale.UUID, [model]);
    }
  }

  const groups: TaxonomyGroup[] = [];
  modelsByLocaleUUID.forEach((groupModels) => {
    const sortedModels = [...groupModels].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    groups.push({
      locale: sortedModels[0].locale,
      models: sortedModels,
      latestModel: sortedModels[0],
    });
  });

  return groups.sort((a, b) => b.latestModel.createdAt.getTime() - a.latestModel.createdAt.getTime());
}
