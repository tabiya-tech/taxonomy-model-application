import {render, screen} from "src/_test_utilities/test-utils";
import PrimaryButton from "./PrimaryButton";

describe("Cancel Button tests", () => {
    test("should render cancel button", () => {
        // GIVEN a PrimaryButton component
        // WHEN the component is rendered
        render(<PrimaryButton data-testid={"foo"}/>)

        // THEN the component should be in the document
        const primaryButton = screen.getByTestId("foo");
        expect(primaryButton).toBeInTheDocument();
    });

    test("should render cancel button with provided name", () => {
        // GIVEN a PrimaryButton component with a custom name
        const customName = "Foo Bar";

        // WHEN the component is rendered
        render(<PrimaryButton>{customName}</PrimaryButton>);

        // THEN the component should be findable by the custom name
        // AND the component should be in the document
        const primaryButton = screen.getByText(customName);
        expect(primaryButton).toBeInTheDocument();
    });

});