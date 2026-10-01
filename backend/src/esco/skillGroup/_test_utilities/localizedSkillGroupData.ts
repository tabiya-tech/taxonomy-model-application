import mongoose, { Connection } from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";

import { FALLBACK_LANGUAGE, MODEL_LANGUAGES, SECONDARY_LANGUAGE } from "./languageNegotiationCases";

const EN = FALLBACK_LANGUAGE.dbKeyName;
const SECONDARY = SECONDARY_LANGUAGE.dbKeyName;

// fixed ids, UUIDs and timestamps, so that a response can be compared byte for byte against a recorded fixture
const FIXED_DATE = new Date("2026-01-01T00:00:00.000Z");
export const LOCALIZED_IDS = {
  parent: "650000000000000000000001",
  skillGroup: "650000000000000000000002",
  childSkillGroup: "650000000000000000000003",
  childSkill: "650000000000000000000004",
};
const UUIDS = {
  parent: "8a1e4c55-0000-4000-8000-000000000001",
  skillGroup: "8a1e4c55-0000-4000-8000-000000000002",
  childSkillGroup: "8a1e4c55-0000-4000-8000-000000000003",
  childSkill: "8a1e4c55-0000-4000-8000-000000000004",
  model: "8a1e4c55-0000-4000-8000-000000000005",
  locale: "8a1e4c55-0000-4000-8000-000000000006",
};

/**
 * The values the skill group under test is expected to be served with in the secondary language: the fields
 * translated in the secondary language are served in it, the others fall back, per field, to the fallback language.
 */
export const EXPECTED_IN_SECONDARY_LANGUAGE = {
  preferredLabel: "Gestion",
  // the second altLabel is not translated in the secondary language
  altLabels: ["Diriger", "Running"],
  // not translated in the secondary language
  description: "Managing teams",
  // translated to a blank value in the secondary language
  scopeNote: "Scope of management",
  parentPreferredLabel: "Groupe parent",
  childSkillGroupPreferredLabel: "Groupe enfant",
  childSkillPreferredLabel: "Compétence enfant",
};

function localizedSkillGroupDoc(
  id: string,
  UUID: string,
  modelId: mongoose.Types.ObjectId,
  code: string,
  fields: Record<string, unknown>
) {
  return {
    _id: new mongoose.Types.ObjectId(id),
    modelId,
    UUID,
    UUIDHistory: [UUID],
    code,
    originUri: `https://example.com/skillGroups/${code}`,
    altLabels: [],
    description: { [EN]: "" },
    scopeNote: { [EN]: "" },
    importId: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...fields,
  };
}

function hierarchyDoc(
  modelId: mongoose.Types.ObjectId,
  parentId: string,
  childId: string,
  childType: ObjectTypes.SkillGroup | ObjectTypes.Skill
) {
  return {
    modelId,
    parentId: new mongoose.Types.ObjectId(parentId),
    parentDocModel: MongooseModelName.SkillGroup,
    parentType: ObjectTypes.SkillGroup,
    childId: new mongoose.Types.ObjectId(childId),
    childDocModel: childType === ObjectTypes.Skill ? MongooseModelName.Skill : MongooseModelName.SkillGroup,
    childType,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  };
}

/**
 * Creates a model available in the fallback and the secondary language, and in it the localized skill groups of
 * insertLocalizedSkillGroups().
 */
export async function createLocalizedSkillGroupData(dbConnection: Connection): Promise<IModelInfo> {
  const model = await getRepositoryRegistry().modelInfo.create({
    name: "Localized model",
    locale: { UUID: UUIDS.locale, name: "English", shortCode: FALLBACK_LANGUAGE.shortCode },
    description: "A model translated in two languages",
    license: "MIT",
    UUIDHistory: [UUIDS.model],
    availableLanguages: MODEL_LANGUAGES,
  });
  await insertLocalizedSkillGroups(dbConnection, model.id);
  return model;
}

/**
 * Inserts in the given model a skill group (with a parent skill group, a child skill group and a child skill) that
 * is partially translated in the secondary language.
 *
 * The documents are written straight to the collections, bypassing mongoose, so that their ids and timestamps are
 * fixed.
 */
export async function insertLocalizedSkillGroups(dbConnection: Connection, givenModelId: string): Promise<void> {
  const modelId = new mongoose.Types.ObjectId(givenModelId);

  await dbConnection.models[MongooseModelName.SkillGroup].collection.insertMany([
    localizedSkillGroupDoc(LOCALIZED_IDS.parent, UUIDS.parent, modelId, "S1", {
      preferredLabel: { [EN]: "Parent group", [SECONDARY]: EXPECTED_IN_SECONDARY_LANGUAGE.parentPreferredLabel },
    }),
    localizedSkillGroupDoc(LOCALIZED_IDS.skillGroup, UUIDS.skillGroup, modelId, "S1.1", {
      preferredLabel: { [EN]: "Management", [SECONDARY]: EXPECTED_IN_SECONDARY_LANGUAGE.preferredLabel },
      altLabels: [{ [EN]: "Leading", [SECONDARY]: "Diriger" }, { [EN]: "Running" }],
      description: { [EN]: EXPECTED_IN_SECONDARY_LANGUAGE.description },
      scopeNote: { [EN]: EXPECTED_IN_SECONDARY_LANGUAGE.scopeNote, [SECONDARY]: "  " },
    }),
    localizedSkillGroupDoc(LOCALIZED_IDS.childSkillGroup, UUIDS.childSkillGroup, modelId, "S1.1.1", {
      preferredLabel: {
        [EN]: "Child group",
        [SECONDARY]: EXPECTED_IN_SECONDARY_LANGUAGE.childSkillGroupPreferredLabel,
      },
    }),
  ]);
  await dbConnection.models[MongooseModelName.Skill].collection.insertOne({
    _id: new mongoose.Types.ObjectId(LOCALIZED_IDS.childSkill),
    modelId,
    UUID: UUIDS.childSkill,
    UUIDHistory: [UUIDS.childSkill],
    originUri: "https://example.com/skills/child",
    preferredLabel: { [EN]: "Child skill", [SECONDARY]: EXPECTED_IN_SECONDARY_LANGUAGE.childSkillPreferredLabel },
    altLabels: [],
    description: { [EN]: "" },
    definition: { [EN]: "" },
    scopeNote: { [EN]: "" },
    skillType: "skill/competence",
    reuseLevel: "cross-sector",
    isLocalized: false,
    importId: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  });
  await dbConnection.models[MongooseModelName.SkillHierarchy].collection.insertMany([
    hierarchyDoc(modelId, LOCALIZED_IDS.parent, LOCALIZED_IDS.skillGroup, ObjectTypes.SkillGroup),
    hierarchyDoc(modelId, LOCALIZED_IDS.skillGroup, LOCALIZED_IDS.childSkillGroup, ObjectTypes.SkillGroup),
    hierarchyDoc(modelId, LOCALIZED_IDS.skillGroup, LOCALIZED_IDS.childSkill, ObjectTypes.Skill),
  ]);
}

/**
 * Replaces the parts of a response body that vary from run to run (the id and UUID of the model, that the model
 * repository generates) with placeholders, so that it can be compared against a recorded fixture.
 */
export function normalizeResponseBody(body: string, model: IModelInfo): string {
  return body.replaceAll(model.id, "{{modelId}}").replaceAll(model.UUID, "{{modelUUID}}");
}
