// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import ApproveModal, { DATA_TEST_ID } from "src/theme/ApproveModal/ApproveModal";

describe("ApproveModal", () => {
  test("should render component correctly", () => {
    // GIVEN the ApproveModal
    const givenNewConversationDialog = (
      <ApproveModal
        title="Sample Title?"
        content={
          <>
            This is a sample body text for the ApproveModal component.
            <br />
            <br />
            Please confirm your action.
          </>
        }
        isOpen={true}
        onCancel={() => {}}
        onApprove={() => {}}
        cancelButtonText="Cancel"
        approveButtonText="Confirm"
      />
    );

    // WHEN the ApproveModal is rendered
    render(givenNewConversationDialog);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND dialog container to be in the document
    const dialogContainer = screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL);
    expect(dialogContainer).toBeInTheDocument();
    // AND dialog title to be in the document
    expect(screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_TITLE)).toBeInTheDocument();
    // AND dialog content to be in the document
    expect(screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_CONTENT)).toBeInTheDocument();
    // AND dialog cancel button to be in the document
    expect(screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_CANCEL)).toBeInTheDocument();
    // AND dialog confirm button to be in the document
    expect(screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_CONFIRM)).toBeInTheDocument();
    // AND dialog to match the snapshot
    expect(dialogContainer).toMatchSnapshot();
  });

  test("Action tests", () => {
    // GIVEN the cancel and approve functions
    const givenCancel = jest.fn();
    const givenApprove = jest.fn();

    // AND the ApproveModal
    const givenNewConversationDialog = (
      <ApproveModal
        title="Sample Title?"
        content={
          <>
            This is a sample body text for the ApproveModal component.
            <br />
            <br />
            Please confirm your action.
          </>
        }
        isOpen={true}
        onCancel={givenCancel}
        onApprove={givenApprove}
        cancelButtonText="Cancel"
        approveButtonText="Confirm"
      />
    );

    // WHEN the ApproveModal is rendered
    render(givenNewConversationDialog);

    // AND the cancel button is clicked
    screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_CANCEL).click();

    // THEN expect the cancel function to have been called
    expect(givenCancel).toHaveBeenCalled();

    // WHEN the confirm button is clicked
    screen.getByTestId(DATA_TEST_ID.APPROVE_MODEL_CONFIRM).click();

    // THEN expect the approval function to have been called
    expect(givenApprove).toHaveBeenCalled();
  });
});
