import { render, screen } from '@testing-library/react';
import ContentHeaderContainer from './ContentHeaderContainer';
import { useAppLayout } from '../AppLayoutProvider';

const TEST_HEADER_TITLE = 'Test Header Content';

// Mocking the useAppLayout hook
jest.mock('../AppLayoutProvider', () => ({
  useAppLayout: jest.fn(),
}));

describe('ContentHeaderContainer', () => {
  it('renders contentHeader from useAppLayout', () => {
    // Provide a mock value for the hook
    (useAppLayout as jest.Mock).mockReturnValue({
      contentHeader: <div>{TEST_HEADER_TITLE}</div>,
    });
    // WHEN the ContentHeaderContainer is rendered
    render(<ContentHeaderContainer />);
    // THEN expect the contentHeader value to be rendered in the document
    expect(screen.getByText(TEST_HEADER_TITLE)).toBeInTheDocument();
  });
});
