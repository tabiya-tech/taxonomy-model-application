import { SkillHierarchyService } from "./skillHierarchy.service";
import { ParentForSkillValidationErrorCode, SkillParentValidationError } from "./skillHierarchy.service.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { getISkillGroupMockData } from "esco/skillGroup/_shared/testDataHelper";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "./skillHierarchy.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { ISkillHierarchyRepository } from "./skillHierarchyRepository";

type MockSkillRepository = jest.Mocked<Pick<ISkillRepository, "findById">>;
type MockSkillGroupRepository = jest.Mocked<Pick<ISkillGroupRepository, "findById">>;
type MockSkillHierarchyRepository = jest.Mocked<Pick<ISkillHierarchyRepository, "createMany" | "updateParent">>;

describe("SkillHierarchyService", () => {
  let skillHierarchyService: SkillHierarchyService;
  let mockSkillRepository: MockSkillRepository;
  let mockSkillGroupRepository: MockSkillGroupRepository;
  let mockSkillHierarchyRepository: MockSkillHierarchyRepository;

  beforeEach(() => {
    mockSkillRepository = {
      findById: jest.fn(),
    };
    mockSkillGroupRepository = {
      findById: jest.fn(),
    };
    mockSkillHierarchyRepository = {
      createMany: jest.fn(),
      updateParent: jest.fn(),
    };

    skillHierarchyService = new SkillHierarchyService(
      mockSkillRepository as unknown as ISkillRepository,
      mockSkillGroupRepository as unknown as ISkillGroupRepository,
      mockSkillHierarchyRepository as unknown as ISkillHierarchyRepository
    );
  });

  describe("setParent", () => {
    test("should successfully set a Skill parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both child and parent successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(10),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.Skill,
          parentType: ObjectTypes.Skill,
          childDocModel: MongooseModelName.Skill,
          parentDocModel: MongooseModelName.Skill,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill for the child skill
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.Skill,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should successfully set a SkillGroup parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill group exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both successfully
      mockSkillRepository.findById.mockResolvedValue(mockChild);
      mockSkillGroupRepository.findById.mockResolvedValue(mockParent);

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(11),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.Skill,
          parentType: ObjectTypes.SkillGroup,
          childDocModel: MongooseModelName.Skill,
          parentDocModel: MongooseModelName.SkillGroup,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill group for the child skill
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.SkillGroup,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should successfully set a SkillGroup child for a SkillGroup parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill group exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill group exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillGroupMockData(1) as ISkillGroup;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both successfully
      mockSkillGroupRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(12),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.SkillGroup,
          parentType: ObjectTypes.SkillGroup,
          childDocModel: MongooseModelName.SkillGroup,
          parentDocModel: MongooseModelName.SkillGroup,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill group for the child skill group
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.SkillGroup,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.SkillGroup,
          childId,
          childType: ObjectTypes.SkillGroup,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should throw PARENT_NOT_FOUND if parent does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND an ID for a parent
      const parentId = getMockStringId(3);

      // AND the database cannot find the parent
      mockSkillRepository.findById.mockResolvedValue(null);

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if child does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database successfully retrieves the parent but not the child
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the child skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw PARENT_NOT_FOUND if parent modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND a parent exists but belongs to a different model
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = getMockStringId(4); // different modelId

      // AND the database returns this parent
      mockSkillRepository.findById.mockResolvedValue(mockParent);

      // WHEN an attempt is made to link them under the initial model
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if child modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a child skill exists but belongs to a different model
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = getMockStringId(4); // different modelId

      // AND a valid parent exists in the correct model
      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link them under the initial model
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the child skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw PARENT_CHILD_CODE_INCONSISTENT if createMany returns empty", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid child skill exists
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database creation unexpectedly returns an empty result
      mockSkillHierarchyRepository.createMany.mockResolvedValue([]);

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating an inconsistency between the parent and child (failed to link)
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
    });

    test("should throw PARENT_CHILD_CODE_INCONSISTENT if the child is set as its own parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a child skill exists
      const childId = getMockStringId(2);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;
      mockSkillRepository.findById.mockResolvedValue(mockChild);

      // WHEN an attempt is made to set the child as its own parent
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        childId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the relationship is inconsistent
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
      // AND expect the hierarchy repository not to be called
      expect(mockSkillHierarchyRepository.createMany).not.toHaveBeenCalled();
    });

    it("should throw DB_FAILED_TO_CREATE_SKILL_PARENT if repository throws unknown error", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid child skill exists
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database throws an unexpected error during creation
      mockSkillHierarchyRepository.createMany.mockRejectedValue(new Error("DB Error"));

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the database failed to create the parent relationship
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT)
      );
    });
  });

  describe("updateParent", () => {
    const modelId = getMockStringId(1);
    const childId = getMockStringId(2);
    const parentId = getMockStringId(3);

    function givenEntitiesExist(parent: ISkill | ISkillGroup) {
      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      parent.id = parentId;
      parent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(parent as ISkill);
        return Promise.resolve(null);
      });

      mockSkillHierarchyRepository.updateParent.mockResolvedValue({
        id: getMockStringId(10),
        modelId,
        childId,
        parentId,
        childType: ObjectTypes.Skill,
        parentType: ObjectTypes.Skill,
        childDocModel: MongooseModelName.Skill,
        parentDocModel: MongooseModelName.Skill,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ISkillHierarchyPair);

      return parent;
    }

    test("should successfully update a Skill parent", async () => {
      // GIVEN a child skill and a new parent skill exist in the model
      const mockParent = givenEntitiesExist(getISkillMockData(2) as ISkill);

      // WHEN an attempt is made to update the parent of the child skill
      const result = await skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect the new parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to update the relationship
      expect(mockSkillHierarchyRepository.updateParent).toHaveBeenCalledWith(modelId, {
        parentId,
        parentType: ObjectTypes.Skill,
        childId,
        childType: ObjectTypes.Skill,
      } as INewSkillHierarchyPairSpec);
    });

    test("should successfully update a SkillGroup parent", async () => {
      // GIVEN a child skill and a new skillGroup parent exist in the model
      const mockParent = givenEntitiesExist(getISkillGroupMockData(2) as ISkillGroup);
      // AND the parent is retrieved from the skillGroup repository
      mockSkillGroupRepository.findById.mockResolvedValue(mockParent as unknown as ISkillGroup);

      // WHEN an attempt is made to update the parent of the child skill
      const result = await skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the new skillGroup parent to be returned
      expect(result).toEqual(mockParent);
      expect(mockSkillHierarchyRepository.updateParent).toHaveBeenCalledWith(modelId, {
        parentId,
        parentType: ObjectTypes.SkillGroup,
        childId,
        childType: ObjectTypes.Skill,
      } as INewSkillHierarchyPairSpec);
    });

    test("should successfully update the parent of a SkillGroup child", async () => {
      // GIVEN a skillGroup child and a new skillGroup parent exist in the model
      const mockChild = getISkillGroupMockData(1) as ISkillGroup;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the child and the parent are retrieved from the skillGroup repository
      mockSkillGroupRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      mockSkillHierarchyRepository.updateParent.mockResolvedValue({
        id: getMockStringId(10),
        modelId,
        childId,
        parentId,
        childType: ObjectTypes.SkillGroup,
        parentType: ObjectTypes.SkillGroup,
        childDocModel: MongooseModelName.SkillGroup,
        parentDocModel: MongooseModelName.SkillGroup,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ISkillHierarchyPair);

      // WHEN an attempt is made to update the parent of the skillGroup child
      const result = await skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.SkillGroup,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the new parent to be returned
      expect(result).toEqual(mockParent);
      expect(mockSkillHierarchyRepository.updateParent).toHaveBeenCalledWith(modelId, {
        parentId,
        parentType: ObjectTypes.SkillGroup,
        childId,
        childType: ObjectTypes.SkillGroup,
      } as INewSkillHierarchyPairSpec);
    });

    test("should return null if no existing parent relation exists for the child", async () => {
      // GIVEN a child skill and a parent exist in the model
      givenEntitiesExist(getISkillMockData(2) as ISkill);
      // AND no existing hierarchy pair exists for the child
      mockSkillHierarchyRepository.updateParent.mockResolvedValue(null);

      // WHEN an attempt is made to update the parent of the child skill
      const result = await skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect null to be returned
      expect(result).toBeNull();
    });

    test("should throw PARENT_NOT_FOUND if the parent does not exist", async () => {
      // GIVEN a child skill exists but no parent is found
      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to update the parent of the child skill
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if the child does not exist", async () => {
      // GIVEN a parent exists but no child is found
      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to update the parent of the child skill
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the child skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw PARENT_NOT_FOUND if the parent belongs to a different model", async () => {
      // GIVEN a child skill exists in the model
      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;
      // AND a parent exists but belongs to a different model
      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = getMockStringId(4);
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to update the parent of the child skill
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw DB_FAILED_TO_UPDATE_SKILL_PARENT_RELATION if repository throws unknown error", async () => {
      // GIVEN a child skill and a parent exist in the model
      givenEntitiesExist(getISkillMockData(2) as ISkill);
      // AND the hierarchy database throws an unexpected error during update
      mockSkillHierarchyRepository.updateParent.mockRejectedValue(new Error("DB Error"));

      // WHEN an attempt is made to update the parent of the child skill
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the database failed to update the parent relationship
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_UPDATE_SKILL_PARENT_RELATION)
      );
    });

    test("should throw PARENT_CHILD_CODE_INCONSISTENT if the child is set as its own parent", async () => {
      // GIVEN a child skill exists in the model
      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;
      mockSkillRepository.findById.mockResolvedValue(mockChild);

      // WHEN an attempt is made to set the child as its own parent
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        childId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the relationship is inconsistent
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
      // AND expect the hierarchy repository not to be called
      expect(mockSkillHierarchyRepository.updateParent).not.toHaveBeenCalled();
    });

    test("should throw PARENT_CHILD_CODE_INCONSISTENT if the relationship pair types are invalid", async () => {
      // GIVEN a skillGroup child and a skill parent exist in the model
      const mockChild = getISkillGroupMockData(1) as ISkillGroup;
      mockChild.id = childId;
      mockChild.modelId = modelId;
      mockSkillGroupRepository.findById.mockResolvedValue(mockChild);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;
      mockSkillRepository.findById.mockResolvedValue(mockParent);

      // WHEN an attempt is made to set a skill as the parent of a skillGroup
      const actualResultPromise = skillHierarchyService.updateParent(
        modelId,
        childId,
        ObjectTypes.SkillGroup,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the relationship is inconsistent
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
      // AND expect the hierarchy repository not to be called
      expect(mockSkillHierarchyRepository.updateParent).not.toHaveBeenCalled();
    });
  });
});
