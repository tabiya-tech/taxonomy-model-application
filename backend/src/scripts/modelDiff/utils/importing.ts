import { readCSV } from "./index";
import {
  IOccupationGroupImportRow,
  IOccupationHierarchyImportRow,
  IOccupationImportRow,
  IOccupationToSkillRelationImportRow,
  ISkillGroupImportRow,
  ISkillHierarchyImportRow,
  ISkillImportRow,
  ISkillToSkillsRelationImportRow,
} from "esco/common/entityToCSV.types";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModel, Occupation, Skill, SkillGroup } from "scripts/modelDiff/types";

function parseUUIDHistory(UUIDHistory: string) {
  const history = arrayFromString(UUIDHistory);

  return {
    UUIDHistory: history,
    recentUUID: history[0],
    originalUUID: history[history.length - 1],
  };
}

export function importSkills(model: IModel) {
  return async function () {
    const result = await readCSV<ISkillImportRow>(`${model._modelPath}/skills.csv`);
    model.setSkills(
      result.rows.map((row) => {
        const result = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          occupations: [],

          parents: [],
          children: [],
        };

        model._caches.skills.set(result.originalUUID, result);

        return result;
      })
    );
  };
}

export function importOccupationGroups(model: IModel) {
  return async function () {
    const result = await readCSV<IOccupationGroupImportRow>(`${model._modelPath}/occupation_groups.csv`);
    model.setOccupationGroups(
      result.rows.map((row) => {
        const result = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          parents: [],
          children: [],
        };

        model._caches.occupationGroups.set(result.originalUUID, result);

        return result;
      })
    );
  };
}

export function importOccupations(model: IModel) {
  return async function () {
    const result = await readCSV<IOccupationImportRow>(`${model._modelPath}/occupations.csv`);
    model.setOccupations(
      result.rows.map((row) => {
        const result = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          children: [],
          parents: [],
          skills: [],
        };

        model._caches.occupations.set(result.originalUUID, result);
        return result;
      })
    );
  };
}

export function importSkillGroups(model: IModel) {
  return async function () {
    const result = await readCSV<ISkillGroupImportRow>(`${model._modelPath}/skill_groups.csv`);
    model.setSkillGroups(
      result.rows.map((row) => {
        const result = {
          row,
          ...parseUUIDHistory(row.UUIDHISTORY),
          altLabels: arrayFromString(row.ALTLABELS),
          children: [],
          parents: [],
        };

        model._caches.skillGroups.set(result.originalUUID, result);

        return result;
      })
    );
  };
}

export function importOccupationToSkillRelations(model: IModel) {
  return async function () {
    const result = await readCSV<IOccupationToSkillRelationImportRow>(
      `${model._modelPath}/occupation_to_skill_relations.csv`
    );
    model.setOccupationToSkill(result.rows);
  };
}

export function importOccupationHierarchy(model: IModel) {
  return async function () {
    const result = await readCSV<IOccupationHierarchyImportRow>(`${model._modelPath}/occupation_hierarchy.csv`);
    model.setOccupationHierarchy(result.rows);
  };
}

export function importSkillHierarchy(model: IModel) {
  return async function () {
    const result = await readCSV<ISkillHierarchyImportRow>(`${model._modelPath}/skill_hierarchy.csv`);
    model.setSkillHierarchy(result.rows);
  };
}

export function importSkillToSkillRelations(model: IModel) {
  return async function () {
    const result = await readCSV<ISkillToSkillsRelationImportRow>(`${model._modelPath}/skill_to_skill_relations.csv`);
    model.setSkillToSkill(result.rows);
  };
}

function loadOccupation(model: IModel, occupation: Occupation) {
  // Add skills
  const relations = model.getOccupationToSKillsRelationsByOccupationId(occupation.row.ID);
  for (const _relation of relations) {
    const skill = model.getSkillById(_relation?.SKILLID);
    occupation.skills.push(
      `${skill!.originalUUID}-${_relation.RELATIONTYPE}-${_relation.SIGNALLINGVALUE}-${_relation.SIGNALLINGVALUELABEL}`
    );
  }

  // Add parents
  const parents = model.getOccupationParentByOccupationId(occupation.row.ID);
  for (const _parent of parents) {
    if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_parent.PARENTOBJECTTYPE)) {
      const occupationGroup = model.getOccupationGroupById(_parent.PARENTID);
      occupation.parents.push(`${_parent.PARENTOBJECTTYPE}@${occupationGroup!.originalUUID}`);
    }

    if ([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation].includes(_parent.PARENTOBJECTTYPE)) {
      const _occupation = model.getOccupationById(_parent.PARENTID);
      occupation.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add childrens.
  const children = model.getOccupationChildrenByOccupationId(occupation.row.ID);
  for (const _child of children) {
    if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_child.CHILDOBJECTTYPE)) {
      const occupationGroup = model.getOccupationGroupById(_child.CHILDID);
      occupation.children.push(`${_child.CHILDOBJECTTYPE}@${occupationGroup!.originalUUID}`);
    }

    if ([ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation].includes(_child.CHILDOBJECTTYPE)) {
      const _occupation = model.getOccupationById(_child.CHILDID);
      occupation.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

export function loadOccupationsRelations(model: IModel) {
  const currentOccupations = model._csvEntities.occupations;

  for (const occupation of currentOccupations) {
    loadOccupation(model, occupation);
  }

  model.setOccupations(currentOccupations);
}

function loadSkill(model: IModel, skill: Skill) {
  // Add occupations.
  const relations = model.getOccupationToSKillsRelationsBySkillId(skill.row.ID);
  for (const _relation of relations) {
    const occupation = model.getOccupationById(_relation?.OCCUPATIONID);
    skill.occupations.push(occupation!.originalUUID);
  }

  // Add parents
  const parents = model.getSkillParentBySkillId(skill.row.ID);
  for (const _parent of parents) {
    if (_parent.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const skillGroup = model.getSkillGroupById(_parent.PARENTID);
      skill.parents.push(`${_parent.PARENTOBJECTTYPE}@${skillGroup!.originalUUID}`);
    }

    if (_parent.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_parent.PARENTID);
      skill.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add children
  const children = model.getSkillChildrenBySkillId(skill.row.ID);
  for (const _child of children) {
    if (_child.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const skillGroup = model.getSkillGroupById(_child.PARENTID);
      skill.children.push(`${_child.PARENTOBJECTTYPE}@${skillGroup!.originalUUID}`);
    }

    if (_child.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_child.PARENTID);
      skill.children.push(`${_child.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

export function loadSkillsRelations(model: IModel) {
  const skills = model._csvEntities.skills;
  for (const skill of skills) {
    loadSkill(model, skill);
  }

  model.setSkills(skills);
}

export function loadOccupationGroupsRelations(model: IModel) {
  const occupationGroups = model._csvEntities.occupationGroups;
  for (const occupationGroup of occupationGroups) {
    // Add parents
    const parents = model.getOccupationParentByOccupationId(occupationGroup.row.ID);
    for (const _parent of parents) {
      if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_parent.PARENTOBJECTTYPE)) {
        const _occupationGroup = model.getOccupationGroupById(_parent.PARENTID);
        occupationGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupationGroup!.originalUUID}`);
      }
    }

    // Add children
    const children = model.getOccupationChildrenByOccupationId(occupationGroup.row.ID);
    for (const _child of children) {
      if ([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup].includes(_child.CHILDOBJECTTYPE)) {
        const _occupationGroup = model.getOccupationGroupById(_child.CHILDID);
        occupationGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupationGroup!.originalUUID}`);
      }

      if ([ObjectTypes.LocalOccupation, ObjectTypes.ESCOOccupation].includes(_child.PARENTOBJECTTYPE)) {
        const _occupation = model.getOccupationById(_child.CHILDID);
        occupationGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
      }
    }
  }

  model.setOccupationGroups(occupationGroups);
}

function loadSkillGroup(model: IModel, skillGroup: SkillGroup) {
  // Add parents
  const parents = model.getSkillParentBySkillId(skillGroup.row.ID);
  for (const _parent of parents) {
    if (_parent.PARENTOBJECTTYPE == ObjectTypes.SkillGroup) {
      const _skillGroup = model.getSkillGroupById(_parent.PARENTID);
      skillGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_skillGroup!.originalUUID}`);
    }

    if (_parent.PARENTOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_parent.PARENTID);
      skillGroup.parents.push(`${_parent.PARENTOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }

  // Add children
  const children = model.getSkillChildrenBySkillId(skillGroup.row.ID);
  for (const _child of children) {
    if (_child.CHILDOBJECTTYPE == ObjectTypes.SkillGroup) {
      const _skillGroup = model.getSkillGroupById(_child.CHILDID);
      skillGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_skillGroup!.originalUUID}`);
    }

    if (_child.CHILDOBJECTTYPE == ObjectTypes.Skill) {
      const _occupation = model.getSkillById(_child.CHILDID);
      skillGroup.children.push(`${_child.CHILDOBJECTTYPE}@${_occupation!.originalUUID}`);
    }
  }
}

export function loadSkillGroupsRelations(model: IModel) {
  const skillGroups = model._csvEntities.skillGroups;

  for (const skillGroup of skillGroups) {
    loadSkillGroup(model, skillGroup);
  }

  model.setSkillGroups(skillGroups);
}
