import ModelDirectoryHeader, {DATA_TEST_ID} from './ModelDirectoryHeader';
import { render, screen } from '@testing-library/react';

describe('ModelDirectoryHeader', () => {
  let defaultProps = {
    onModalImport: jest.fn(),
  };

  afterEach(() =>{
    defaultProps.onModalImport.mockClear();
  })

  test('should render model directory header component', () => {
    // GIVEN a ModelDirectoryHeader component
    render(<ModelDirectoryHeader {...defaultProps} />);
    // THEN expect the header to be shown
    expect(screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.MODEL_DIRECTORY_TITLE)).toBeInTheDocument()
  });

  test('should call onModalImport when import button is clicked', () => {
    // GIVEN a ModelDirectoryHeader component
    render(<ModelDirectoryHeader {...defaultProps} />);
    // WHEN the import button is clicked
    screen.getByTestId(DATA_TEST_ID.IMPORT_MODEL_BUTTON).click();
    // THEN expect the onModalImport to be called
    expect(defaultProps.onModalImport).toHaveBeenCalledTimes(1);
  });
});
