import { render, screen, act } from '@testing-library/react';
import { AppLayoutProvider, useAppLayout } from './AppLayoutProvider';

const UPDATED_CONTENT_HEADER = 'Content Header'
const UPDATE_HEADER_BUTTON_TEST_ID='update-header-button'

// GIVEN a TestComponent that uses useAppLayout
function TestComponent() {
  const { contentHeader, setContentHeader } = useAppLayout();

  return (
    <div>
      <div>{contentHeader}</div>
      <button onClick={() => setContentHeader('Content Header')} data-testid={UPDATE_HEADER_BUTTON_TEST_ID}>Update Header</button>
    </div>
  );
}

describe('AppLayoutProvider and useAppLayout', () => {
    
  it('should provides default state', () => {
    // WHEN the AppLayoutProvider is rendered
    render(
      <AppLayoutProvider>
        <TestComponent />
      </AppLayoutProvider>
    );
    // THEN expect the default state to be provided
    expect(screen.queryByText(UPDATED_CONTENT_HEADER)).not.toBeInTheDocument();
  });

  it('should updates the contentHeader when setContentHeader is called', () => {
    // WHEN the AppLayoutProvider is rendered
    render(
      <AppLayoutProvider>
        <TestComponent />
      </AppLayoutProvider>
    );
    // AND the setContentHeader is triggered
    act(() => {
      screen.getByTestId(UPDATE_HEADER_BUTTON_TEST_ID).click();
    });
    // THEN expect the contentHeader to updated and rendered in the document
    expect(screen.getByText(UPDATED_CONTENT_HEADER)).toBeInTheDocument();
  });

  it('throws an error if useAppLayout is not used within AppLayoutProvider', () => {
    // WHEN the TestComponent is rendered out side of AppLayoutProvider
    // THEN expect an error to be thrown
    expect(() => render(<TestComponent />)).toThrow(
      'useAppLayout must be used within an AppLayoutProvider'
    );
  });
});
