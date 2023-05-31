import mongoose from 'mongoose';
import {RegEx_Skill_Group_Code, RegExp_ID, RegExp_UUIDv4} from "../server/regex";
import {stringRequired} from "../server/stringRequired";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty
} from "../esco/common/modelSchema";

export const ModelName = "SkillGroupModel";

export const CHILDREN_MAX_ITEMS = 100;

export const PARENT_MAX_ITEMS = 100;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillGroup> {
  // Main Schema
  const SkillGroupSchema = new mongoose.Schema<ISkillGroup>({
    UUID: {type: String, required: true, validate: RegExp_UUIDv4},
    preferredLabel: PreferredLabelProperty,
    code: {
      type: String,
      required: stringRequired("code"),
      validate: {
        validator: function (value: string): boolean {
          if (value === '') {
            return true;
          }
          return RegEx_Skill_Group_Code.test(value);
        },
        // @ts-ignore
        message: props => `${props.value} is not a valid code.`
      },
    },
    modelId: {type: String, required: true, validate: RegExp_ID},
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    altLabels: AltLabelsProperty,
    description: DescriptionProperty,
    scopeNote: ScopeNoteProperty,
    //childrenGroups: [{type: mongoose.Schema.Types.ObjectId, ref: ModelName}],
    parentGroups: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: ModelName,
      validate: {
        validator: (values: unknown) => {
          if (Array.isArray(values)) {
            const s: Set<string> = new Set<string>(values.map(v => v.toString()));
            return values.length === s.size && values.length <= PARENT_MAX_ITEMS;
          }
          return true;
        },
        message: () => `Parents must be at most ${PARENT_MAX_ITEMS} uniques refs.`
      }
    }
  }, {timestamps: true, strict: "throw"},);
  SkillGroupSchema.index({UUID: 1}, {unique: true});
  SkillGroupSchema.index({modelId: 1});
  // Model

  SkillGroupSchema.virtual('childrenGroups', {
    localField: '_id',
    foreignField: 'parentGroups',
    ref: ModelName
  });

  return dbConnection.model<ISkillGroup>(ModelName, SkillGroupSchema);
}

export interface ISkillGroupReference {
  id: string
  UUID: string
  code: string
  preferredLabel: string
}

export interface ISkillGroup {
  id: string
  UUID: string
  code: string
  preferredLabel: string
  modelId: string
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  scopeNote: string
  parentGroups?: string[] | ISkillGroupReference[]
  childrenGroups?: string[] | ISkillGroupReference[]
  createdAt: Date,
  updatedAt: Date
}

export type SkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parentGroups" | "childrenGroups" | "createdAt" | "updatedAt">;

