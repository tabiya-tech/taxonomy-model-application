import { OccupationHierarchyService } from "./occupationHierarchy.service";
import {
  ParentForOccupationValidationErrorCode,
  OccupationParentValidationError,
} from "./occupationHierarchy.service.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes } from "esco/common/objectTypes";
import { getIOccupationMockData } from "esco/occupations/_shared/testDataHelper";
import { getIOccupationGroupMockData } from "esco/occupationGroup/_shared/testDataHelper";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import mongoose from "mongoose";
import "_test_utilities/consoleMock";

describe("OccupationHierarchyService Unit Tests", () => {
  let occupationRepositoryMock: {
    findById: jest.Mock;
  };
  let occupationGroupRepositoryMock: {
    findById: jest.Mock;
  };
  let occupationHierarchyRepositoryMock: {
    createMany: jest.Mock;
  };

  let service: OccupationHierarchyService;

  beforeEach(() => {
    jest.clearAllMocks();

    occupationRepositoryMock = {
      findById: jest.fn(),
    };
    occupationGroupRepositoryMock = {
      findById: jest.fn(),
    };
    occupationHierarchyRepositoryMock = {
      createMany: jest.fn(),
    };

    service = new OccupationHierarchyService(
      occupationRepositoryMock as unknown as IOccupationRepository,
      occupationGroupRepositoryMock as unknown as IOccupationGroupRepository,
      occupationHierarchyRepositoryMock as unknown as IOccupationHierarchyRepository
    );
  });

  test("should successfully set parent for child occupation", async () => {
    const givenModelId = getMockStringId(1);
    const givenChildId = getMockStringId(2);
    const givenParentId = getMockStringId(3);

    const mockParent = {
      ...getIOccupationMockData(3),
      _id: new mongoose.Types.ObjectId(givenParentId),
      code: "1234",
      occupationType: ObjectTypes.ESCOOccupation,
      modelId: givenModelId,
    };

    occupationRepositoryMock.findById.mockResolvedValue(mockParent);
    occupationHierarchyRepositoryMock.createMany.mockResolvedValue([{}]);

    const result = await service.setParent(
      givenModelId,
      givenChildId,
      ObjectTypes.ESCOOccupation,
      givenParentId,
      ObjectTypes.ESCOOccupation
    );

    expect(result).toEqual(mockParent);
    expect(occupationHierarchyRepositoryMock.createMany).toHaveBeenCalledWith(givenModelId, [
      {
        parentId: givenParentId,
        parentType: ObjectTypes.ESCOOccupation,
        childId: givenChildId,
        childType: ObjectTypes.ESCOOccupation,
      },
    ]);
  });

  test("should successfully set parent for child group (ISCOGroup parent)", async () => {
    const givenModelId = getMockStringId(1);
    const givenChildId = getMockStringId(2);
    const givenParentId = getMockStringId(3);

    const mockGroupParent = {
      ...getIOccupationGroupMockData(3),
      _id: new mongoose.Types.ObjectId(givenParentId),
      code: "12",
      groupType: ObjectTypes.ISCOGroup,
      modelId: givenModelId,
    };

    occupationGroupRepositoryMock.findById.mockResolvedValue(mockGroupParent);
    occupationHierarchyRepositoryMock.createMany.mockResolvedValue([{}]);

    const result = await service.setParent(
      givenModelId,
      givenChildId,
      ObjectTypes.ISCOGroup,
      givenParentId,
      ObjectTypes.ISCOGroup
    );

    expect(result).toEqual(mockGroupParent);
    expect(occupationHierarchyRepositoryMock.createMany).toHaveBeenCalledWith(givenModelId, [
      {
        parentId: givenParentId,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChildId,
        childType: ObjectTypes.ISCOGroup,
      },
    ]);
  });

  test("should throw PARENT_CHILD_CODE_INCONSISTENT when createMany returns empty array", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });
    occupationHierarchyRepositoryMock.createMany.mockResolvedValue([]);

    await expect(
      service.setParent(
        getMockStringId(1),
        getMockStringId(2),
        ObjectTypes.ESCOOccupation,
        getMockStringId(3),
        ObjectTypes.ESCOOccupation
      )
    ).rejects.toThrow(
      new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
    );
  });

  test("should throw DB_FAILED_TO_CREATE_OCCUPATION_PARENT when createMany fails", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });
    occupationHierarchyRepositoryMock.createMany.mockRejectedValue(new Error("Database write error"));

    await expect(
      service.setParent(
        getMockStringId(1),
        getMockStringId(2),
        ObjectTypes.ESCOOccupation,
        getMockStringId(3),
        ObjectTypes.ESCOOccupation
      )
    ).rejects.toThrow(
      new OccupationParentValidationError(ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT)
    );
  });

  test("should throw PARENT_NOT_FOUND if parent group is not found", async () => {
    occupationHierarchyRepositoryMock.createMany.mockResolvedValue([{}]);
    occupationGroupRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.setParent(
        getMockStringId(1),
        getMockStringId(2),
        ObjectTypes.ESCOOccupation,
        getMockStringId(3),
        ObjectTypes.ISCOGroup
      )
    ).rejects.toThrow(new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND));
  });

  test("should throw PARENT_NOT_FOUND if parent occupation has wrong modelId", async () => {
    occupationHierarchyRepositoryMock.createMany.mockResolvedValue([{}]);
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(999),
    });

    await expect(
      service.setParent(
        getMockStringId(1),
        getMockStringId(2),
        ObjectTypes.ESCOOccupation,
        getMockStringId(3),
        ObjectTypes.ESCOOccupation
      )
    ).rejects.toThrow(new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND));
  });
});
