import React from "react";
import Stepper, { DATA_TEST_ID } from "./Stepper";
import { render, screen, act, waitFor } from "src/_test_utilities/test-utils";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";

const generateSteps = (numSteps: number) => {
  const steps = [];
  for (let i = 0; i < numSteps; i++) {
    steps.push({
      id: i.toString(),
      title: `Step ${i}`,
      subtitle: `Subtitle ${i}`,
      content: <div>{getRandomLorem(1000)}</div>,
    });
  }
  return steps;
};

describe("Stepper Component", () => {
  describe("render tests", () => {
    test.each([0, 1, 2, 3, 10])("renders %i steps", (numSteps) => {
      // GIVEN the steps with the number of steps
      const steps = generateSteps(numSteps);

      // WHEN the Stepper component is rendered
      render(<Stepper steps={steps} />);

      // THEN the Stepper container should be in document.
      const container = screen.getByTestId(DATA_TEST_ID.CONTAINER);
      expect(container).toBeInTheDocument();

      for (let i = 0; i < numSteps; i++) {
        // AND the step container should be in document.
        const stepContainer = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTAINER}-${i}`);
        expect(stepContainer).toBeInTheDocument();

        // AND the step label should be in document.
        const stepLabel = screen.getByTestId(`${DATA_TEST_ID.STEP_LABEL}-${i}`);
        expect(stepLabel).toBeInTheDocument();

        // AND the step label subtitle should be in document.
        const stepLabelSubtitle = screen.getByTestId(`${DATA_TEST_ID.STEP_LABEL_SUBTITLE}-${i}`);
        expect(stepLabelSubtitle).toBeInTheDocument();

        // AND the step content should be in document.
        const stepContent = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTENT}-${i}`);
        expect(stepContent).toBeInTheDocument();
      }
    });
  });

  describe("action tests", () => {
    test("action buttons should work as expected", async () => {
      // GIVEN 3 number of steps.
      const steps = generateSteps(3);

      // AND the Stepper component is rendered
      render(<Stepper steps={steps} />);

      const stepContainer0 = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTAINER}-0`);
      const stepContent0 = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTENT_STACK}-0`);

      const stepContainer1 = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTAINER}-1`);
      const stepContent1 = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTENT_STACK}-1`);

      const stepContent2 = screen.getByTestId(`${DATA_TEST_ID.STEP_CONTENT_STACK}-2`);

      // WHEN the next button is clicked
      const nextButton = screen.getByTestId(`${DATA_TEST_ID.STEP_NEXT_BUTTON}-0`);
      expect(nextButton).toBeInTheDocument();

      expect(stepContent0).toBeVisible();
      expect(stepContent1).not.toBeVisible();
      expect(stepContent2).not.toBeVisible();

      act(() => {
        nextButton.click();
      });

      // THEN step one should be marked as completed
      expect(stepContainer0).toHaveClass("Mui-completed");

      await waitFor(() => expect(stepContent0).not.toBeVisible());
      expect(stepContent1).toBeVisible();
      expect(stepContent2).not.toBeVisible();

      // WHEN the next button is clicked
      const nextButton1 = screen.getByTestId(`${DATA_TEST_ID.STEP_NEXT_BUTTON}-1`);
      expect(nextButton1).toBeInTheDocument();

      act(() => {
        nextButton1.click();
      });

      expect(stepContent0).not.toBeVisible();
      await waitFor(() => expect(stepContent1).not.toBeVisible());
      expect(stepContent2).toBeVisible();

      // THEN step two should be marked as completed
      expect(stepContainer1).toHaveClass("Mui-completed");

      // WHEN the back button is clicked
      const backButton = screen.getByTestId(`${DATA_TEST_ID.STEP_BACK_BUTTON}-1`);
      expect(backButton).toBeInTheDocument();

      act(() => {
        backButton.click();
      });

      // AND step two should not be marked as completed
      expect(stepContainer1).not.toHaveClass("Mui-completed");

      expect(stepContent0).not.toBeVisible();
      expect(stepContent1).toBeVisible();
      await waitFor(() => expect(stepContent2).not.toBeVisible());
    });
  });
});
