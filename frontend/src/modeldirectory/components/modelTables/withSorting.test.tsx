import React from 'react';
import {act, render} from '@testing-library/react';
import '@testing-library/jest-dom';
import withSorting from './withSorting';
import ModelsTable, {ModelsTableProps} from './ModelsTable';
import {SortDirection} from "./withSorting.types";
import {getOneFakeModel} from "./_test_utilities/mockModelData";
import {ModelInfoTypes} from "../../../modelInfo/modelInfoTypes";

// Mocking ModelsTable component
jest.mock('./ModelsTable', () => jest.fn(() => null));


describe('withSorting HOC', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const SortedModelsTable = withSorting(ModelsTable);
  const givenModel= getOneFakeModel()

  test('should sort models by updatedAt in descending order initially', () => {
    // GIVEN a list of unsorted models
    const givenUnsortedModels = [
      { ...givenModel, id: '1', name: 'A', updatedAt: new Date('2022-01-01T00:00:00.000Z') },
      { ...givenModel, id: '2', name: 'B', updatedAt: new Date('2022-01-02T00:00:00.000Z') }
    ];

    // WHEN the component renders
    render(<SortedModelsTable models={givenUnsortedModels} />);

    // THEN the models should be sorted by updatedAt in descending order
    expect(ModelsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        models: [
          { ...givenModel, id: '2', name: 'B', updatedAt: new Date('2022-01-02T00:00:00.000Z') },
          { ...givenModel, id: '1', name: 'A', updatedAt: new Date('2022-01-01T00:00:00.000Z') }
        ]
      }),
      {}
    );
  });

  test.each([
    // GIVEN a sorting direction of ASCENDING
    ['ASCENDING', SortDirection.ASCENDING],
    // GIVEN a sorting direction of DESCENDING
    ["DESCENDING", SortDirection.DESCENDING],
    // GIVEN no sorting direction
    ["Not Defined", undefined]]
  )('should sort models by name when the name is selected as a key for sorting and the direction is %s', (description : string, direction?: SortDirection) => {
    // GIVEN a list of unsorted models
    const givenUnsortedModels = [
      { ...givenModel, id: '1', name: 'B' },
      { ...givenModel, id: '2', name: 'A' }
    ];

    render(<SortedModelsTable models={givenUnsortedModels} />);

    const lastCall = (ModelsTable as jest.Mock).mock.calls.pop();
    const capturedProps = lastCall ? (lastCall[0] as ModelsTableProps) : null;

    // WHEN name is selected as a key for sorting
    act(() => {
      capturedProps?.requestSort && capturedProps.requestSort('name', direction);
    });

    // THEN the models should be sorted by name in the defined order
    expect(ModelsTable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        models: givenUnsortedModels.sort((a: ModelInfoTypes.ModelInfo ,b: ModelInfoTypes.ModelInfo) => {
          if(direction === SortDirection.DESCENDING){
            return b.name.localeCompare(a.name)
          }
          return a.name.localeCompare(b.name)
        })
      }),
      expect.anything()
    );
  });

  test.each([
    // GIVEN a sorting direction of ASCENDING
    ['ASCENDING', SortDirection.ASCENDING],
    // GIVEN a sorting direction of DESCENDING
    ['DESCENDING', SortDirection.DESCENDING],
    // GIVEN no sorting direction
    ['Not Defined', undefined]
  ])('should sort models by updatedAt when updatedAt is selected as a key for sorting and the direction is %s', (description : string, direction?: SortDirection) => {
    // GIVEN a list of unsorted models
    const givenUnsortedModels = [
      { ...givenModel, id: '1', updatedAt: new Date('2022-01-01T00:00:00.000Z') },
      { ...givenModel, id: '2', updatedAt: new Date('2022-01-02T00:00:00.000Z') }
    ];

    // WHEN the component renders
    render(<SortedModelsTable models={givenUnsortedModels} />);

    const lastCall = (ModelsTable as jest.Mock).mock.calls.pop();
    const capturedProps = lastCall ? (lastCall[0] as ModelsTableProps) : null;

    // WHEN updatedAt is selected as a key for sorting
    act(() => {
      capturedProps?.requestSort && capturedProps.requestSort('updatedAt', direction);
    });

    // THEN the models should be sorted by updatedAt in the defined order
    expect(ModelsTable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        models: givenUnsortedModels.sort((a: ModelInfoTypes.ModelInfo, b: ModelInfoTypes.ModelInfo) => {
          const timeA = a.updatedAt.getTime();
          const timeB = b.updatedAt.getTime();
          return direction === SortDirection.ASCENDING ? timeA - timeB : timeB - timeA;
        })
      }),
      expect.anything()
    );
  });

  test.each([
    // GIVEN a sorting direction of ASCENDING
    ['ASCENDING', SortDirection.ASCENDING],
    // GIVEN a sorting direction of DESCENDING
    ['DESCENDING', SortDirection.DESCENDING],
    // GIVEN no sorting direction
    ['Not Defined', undefined]
  ])('should sort models by version when version is selected as a key for sorting and the direction is %s', (description : string, direction?: SortDirection) => {
    // GIVEN a list of unsorted models
    const givenUnsortedModels = [
      { ...givenModel, id: '1', version: '1.0.0' },
      { ...givenModel, id: '2', version: '0.9.0' }
    ];

    // WHEN the component renders
    render(<SortedModelsTable models={givenUnsortedModels} />);

    const lastCall = (ModelsTable as jest.Mock).mock.calls.pop();
    const capturedProps = lastCall ? (lastCall[0] as ModelsTableProps) : null;

    // WHEN version is selected as a key for sorting
    act(() => {
      capturedProps?.requestSort && capturedProps.requestSort('version', direction);
    });

    // THEN the models should be sorted by version in the defined order
    expect(ModelsTable).toHaveBeenLastCalledWith(
      expect.objectContaining({
        models: givenUnsortedModels.sort((a: ModelInfoTypes.ModelInfo, b: ModelInfoTypes.ModelInfo) => {
          return direction === SortDirection.ASCENDING
            ? a.version.localeCompare(b.version)
            : b.version.localeCompare(a.version);
        })
      }),
      expect.anything()
    );
  });


  test('should handle empty models array gracefully', () => {
    // GIVEN an empty models array
    // WHEN the component renders
    render(<SortedModelsTable models={[]} />);

    // THEN it should render correctly without crashing
    expect(ModelsTable).not.toThrowError();
    expect(ModelsTable).toHaveBeenCalledWith(
      expect.objectContaining({ models: [] }),
      {}
    );
  });

  test('should handle single model in models array correctly', () => {
    // GIVEN a models array with a single model
    const givenUnsortedModels = [{ ...givenModel, id: '1', name: 'A' }];

    // WHEN the component renders
    render(<SortedModelsTable models={givenUnsortedModels} />);

    // THEN it should render correctly
    expect(ModelsTable).toHaveBeenCalledWith(
      expect.objectContaining({ models: givenUnsortedModels }),
      expect.anything()
    );

    const lastCall = (ModelsTable as jest.Mock).mock.calls[0];
    const capturedProps = lastCall ? (lastCall[0] as ModelsTableProps) : null;

    // AND WHEN a sort is requested
    act(() => {
      capturedProps?.requestSort && capturedProps.requestSort('name');
    });

    // THEN expect the modelsTable not to get re-rendered with different props
    expect(ModelsTable).toHaveBeenNthCalledWith(1,
      expect.objectContaining({ models: givenUnsortedModels }),
      expect.anything()
    );
  });
});

export {};
