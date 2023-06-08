import mongoose from 'mongoose';
import {RegEx_Skill_Group_Code, RegExp_UUIDv4} from "server/regex";
import {stringRequired} from "server/stringRequired";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty, hasUniqueValues,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty
} from "esco/common/modelSchema";

export const ModelName = "SkillGroupModel";

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
    modelId: {type: mongoose.Schema.Types.ObjectId, required: true},
    originUUID: OriginUUIDProperty,
    ESCOUri: ESCOUriProperty,
    altLabels: AltLabelsProperty,
    description: DescriptionProperty,
    scopeNote: ScopeNoteProperty,
    parentGroups: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      default: undefined,
      ref: ModelName,
      validate: (value: mongoose.Schema.Types.ObjectId[]) => {
        if (value.length > PARENT_MAX_ITEMS) {
          throw new Error(`Parents must be at most ${PARENT_MAX_ITEMS} uniques refs.`);
        }

        if (!hasUniqueValues(value.map(v => v.toString()))) {
          throw new Error('Duplicate parents found');
        }
        return true;
      }
    }
  }, {timestamps: true, strict: "throw"},);
  SkillGroupSchema.virtual('childrenGroups', {
    localField: '_id',
    foreignField: 'parentGroups',
    ref: ModelName
  });

  SkillGroupSchema.index({UUID: 1}, {unique: true});

  SkillGroupSchema.index({modelId: 1});

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
  modelId: string | mongoose.Types.ObjectId
  originUUID: string
  ESCOUri: string
  altLabels: string[]
  description: string
  scopeNote: string
  parentGroups: string[] | mongoose.Types.ObjectId[] | ISkillGroupReference[]
  childrenGroups: string[] | mongoose.Types.ObjectId[] | ISkillGroupReference[]
  createdAt: Date,
  updatedAt: Date
}

export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parentGroups" | "childrenGroups" | "createdAt" | "updatedAt">;

