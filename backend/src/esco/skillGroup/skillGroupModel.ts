import mongoose from 'mongoose';
import {RegEx_Skill_Group_Code, RegExp_UUIDv4} from "server/regex";
import {stringRequired} from "server/stringRequired";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty, hasUniqueValues, ImportIDProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty
} from "esco/common/modelSchema";
import {ISkillGroupDoc} from "./skillGroup.types";
import {MongooseModelName} from "esco/common/mongooseModelNames";

export const PARENT_MAX_ITEMS = 100;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillGroupDoc> {
  // Main Schema
  const SkillGroupSchema = new mongoose.Schema<ISkillGroupDoc>({
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
    importId: ImportIDProperty,
    parentGroups: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      default: undefined,
      ref: MongooseModelName.SkillGroup,
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
    ref: MongooseModelName.SkillGroup
  });

  SkillGroupSchema.index({UUID: 1}, {unique: true});

  SkillGroupSchema.index({modelId: 1});

  return dbConnection.model<ISkillGroupDoc>(MongooseModelName.SkillGroup, SkillGroupSchema);
}