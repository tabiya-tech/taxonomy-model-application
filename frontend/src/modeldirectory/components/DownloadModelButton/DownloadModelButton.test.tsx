// mock the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import { DATA_TEST_ID, DownloadModelButton } from "./DownloadModelButton";

describe("DownloadModelButton", () => {
  it("should render", () => {
    // GIVEN a download url
    const givenFilename = "filename.zip";
    const givenDownloadUrl = `https://foo/bar/${givenFilename}`;
    // WHEN the button is rendered
    render(<DownloadModelButton downloadUrl={givenDownloadUrl} />);

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the button is rendered
    const actualButton = screen.getByTestId(DATA_TEST_ID.DOWNLOAD_MODEL_BUTTON);
    expect(actualButton).toBeInTheDocument();
    // AND the button has the correct href
    expect(actualButton).toHaveAttribute("href", givenDownloadUrl);
    // AND the button has the correct download attribute
    expect(actualButton).toHaveAttribute("download", givenFilename);
    // AND to match the snapshot
    expect(actualButton).toMatchSnapshot();
  });
});
