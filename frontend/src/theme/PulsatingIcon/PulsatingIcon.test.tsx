// mock the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { PulsatingIcon } from "./PulsatingIcon";
import CloudDownload from "@mui/icons-material/CloudDownload";

describe("PulsatingIcon", () => {
  it("should render without crashing", () => {
    // GIVEN some icon
    const givenIcon = CloudDownload;

    // AND some props for the icon
    const givenProps = {
      titleAccess: "some title",
      "data-testid": "foo-data-testid",
    };

    // WHEN we render the pulsating icon with the given icon and props
    render(<PulsatingIcon icon={givenIcon} {...givenProps} />);

    // THEN no warnings or errors should be logged
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    // THEN we expect the icon to found in the document
    const actualIcon = screen.getByTestId("foo-data-testid");
    expect(actualIcon).toBeInTheDocument();
    // AND to match the snapshot
    expect(actualIcon).toMatchSnapshot();
  });
});
