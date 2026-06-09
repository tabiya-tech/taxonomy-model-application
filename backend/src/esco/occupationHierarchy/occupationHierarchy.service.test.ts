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
    Model: {
      findOne: jest.Mock;
    };
  };
  let occupationGroupRepositoryMock: {
    Model: {
      findOne: jest.Mock;
    };
  };
  let occupationHierarchyRepositoryMock: {
    hierarchyModel: {
      findOneAndUpdate: jest.Mock;
    };
  };

  let service: OccupationHierarchyService;

  beforeEach(() => {
    jest.clearAllMocks();

    occupationRepositoryMock = {
      Model: {
        findOne: jest.fn(),
      },
    };
    occupationGroupRepositoryMock = {
      Model: {
        findOne: jest.fn(),
      },
    };
    occupationHierarchyRepositoryMock = {
      hierarchyModel: {
        findOneAndUpdate: jest.fn(),
      },
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

    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(givenChildId),
      code: "1234.1.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };

    const mockParent = {
      ...getIOccupationMockData(3),
      _id: new mongoose.Types.ObjectId(givenParentId),
      code: "1234.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };

    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    const mockParentDoc = {
      ...mockParent,
      toObject: jest.fn().mockReturnValue(mockParent),
      exec: jest.fn(),
    };
    mockParentDoc.exec.mockResolvedValue(mockParentDoc);

    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc).mockReturnValueOnce(mockParentDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockResolvedValue({}),
    };
    occupationHierarchyRepositoryMock.hierarchyModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    const result = await service.setParent(givenModelId, givenChildId, givenParentId, ObjectTypes.ESCOOccupation);

    expect(result).toEqual(mockParent);
  });

  test("should successfully set parent for child occupation (LocalOccupation parent)", async () => {
    const givenModelId = getMockStringId(1);
    const givenChildId = getMockStringId(2);
    const RouterParentId = getMockStringId(3);

    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(givenChildId),
      code: "1234.1_1",
      occupationType: ObjectTypes.LocalOccupation,
    };

    const mockParent = {
      ...getIOccupationMockData(3),
      _id: new mongoose.Types.ObjectId(RouterParentId),
      code: "1234.1",
      occupationType: ObjectTypes.LocalOccupation,
    };

    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    const mockParentDoc = {
      ...mockParent,
      toObject: jest.fn().mockReturnValue(mockParent),
      exec: jest.fn(),
    };
    mockParentDoc.exec.mockResolvedValue(mockParentDoc);

    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc).mockReturnValueOnce(mockParentDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockResolvedValue({}),
    };
    occupationHierarchyRepositoryMock.hierarchyModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    const result = await service.setParent(givenModelId, givenChildId, RouterParentId, ObjectTypes.LocalOccupation);

    expect(result).toEqual(mockParent);
  });

  test("should throw OCCUPATION_NOT_FOUND when child is not found", async () => {
    const mockChildDoc = {
      exec: jest.fn().mockResolvedValue(null),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValue(mockChildDoc);

    await expect(
      service.setParent(getMockStringId(1), getMockStringId(2), getMockStringId(3), ObjectTypes.ESCOOccupation)
    ).rejects.toThrow(new OccupationParentValidationError(ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND));
  });

  test("should throw PARENT_NOT_FOUND when parent occupation is not found", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockParentDoc = {
      exec: jest.fn().mockResolvedValue(null),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockParentDoc);

    await expect(
      service.setParent(getMockStringId(1), getMockStringId(2), getMockStringId(3), ObjectTypes.ESCOOccupation)
    ).rejects.toThrow(new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND));
  });

  test("should throw INVALID_PARENT_TYPE when parent is group but type validation fails", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockParentGroup = {
      ...getIOccupationGroupMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
      groupType: ObjectTypes.LocalGroup,
    };
    const mockParentDoc = {
      ...mockParentGroup,
      exec: jest.fn().mockResolvedValue(mockParentGroup),
    };
    occupationGroupRepositoryMock.Model.findOne.mockReturnValueOnce(mockParentDoc);

    await expect(
      service.setParent(getMockStringId(1), getMockStringId(2), getMockStringId(3), ObjectTypes.ISCOGroup)
    ).rejects.toThrow(new OccupationParentValidationError(ParentForOccupationValidationErrorCode.INVALID_PARENT_TYPE));
  });

  test("should throw PARENT_CHILD_CODE_INCONSISTENT when code consistency check fails", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      code: "1234.1.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockParent = {
      ...getIOccupationMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
      code: "5678.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockParentDoc = {
      ...mockParent,
      exec: jest.fn().mockResolvedValue(mockParent),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockParentDoc);

    await expect(
      service.setParent(getMockStringId(1), getMockStringId(2), getMockStringId(3), ObjectTypes.ESCOOccupation)
    ).rejects.toThrow(
      new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
    );
  });

  test("should throw DB_FAILED_TO_CREATE_OCCUPATION_PARENT when findOneAndUpdate fails", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      code: "1234.1.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockParent = {
      ...getIOccupationMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
      code: "1234.1",
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockParentDoc = {
      ...mockParent,
      exec: jest.fn().mockResolvedValue(mockParent),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockParentDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockRejectedValue(new Error("Database write error")),
    };
    occupationHierarchyRepositoryMock.hierarchyModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    await expect(
      service.setParent(getMockStringId(1), getMockStringId(2), getMockStringId(3), ObjectTypes.ESCOOccupation)
    ).rejects.toThrow(
      new OccupationParentValidationError(ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT)
    );
  });
});
