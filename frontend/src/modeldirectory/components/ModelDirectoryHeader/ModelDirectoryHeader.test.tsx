import ModelDirectoryHeader, {DATA_TEST_ID} from './ModelDirectoryHeader';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ModelDirectoryHeader', () => {
  test('should render model directory header component', () => {
    // GIVEN an onModelImport callback function
    const givenOnModelImportCallback = () => {
    };

    // WHEN a ModelDirectoryHeader component is rendered with the given callback
    render(<ModelDirectoryHeader onModelImport={givenOnModelImportCallback}/>);

    // THEN expect specific elements to be present in the document
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_HEADER)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_TITLE)).toBeInTheDocument()
  });

  test('should call onModelImport when import button is clicked', async () => {
    // GIVEN an onModelImport callback function
    const givenOnModelImportCallback = jest.fn();

    // WHEN a ModelDirectoryHeader component is rendered with the given callback
    render(<ModelDirectoryHeader onModelImport={givenOnModelImportCallback}/>);
    // AND the import button is clicked
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON));

    // THEN expect the onModelImport callback to be triggered once
    expect(givenOnModelImportCallback).toHaveBeenCalledTimes(1);
  });
});