// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "src/_test_utilities/test-utils";
import Footer, { DATA_TEST_ID } from "./Footer";

describe("Footer", () => {
  afterEach(() => {
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });
  });

  test("should render nothing when PARTNER_LOGOS is not set", () => {
    // GIVEN the PARTNER_LOGOS environment variable is not set
    Object.defineProperty(window, "tabiyaConfig", {
      value: {},
      writable: true,
    });

    // WHEN the Footer is rendered
    const { container } = render(<Footer />);

    // THEN expect no errors or warnings to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND expect nothing to be rendered
    expect(screen.queryByTestId(DATA_TEST_ID.FOOTER)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  test("should show the partner logos with the configured alt/height/width when PARTNER_LOGOS is set", () => {
    // GIVEN the PARTNER_LOGOS environment variable is set to a JSON array of logo configs
    const givenLogos = [
      { src: "/world-bank-logo.svg", alt: "World Bank Group", height: 28, width: 80 },
      { src: "/tabiya-logo.svg" },
    ];
    Object.defineProperty(window, "tabiyaConfig", {
      value: {
        PARTNER_LOGOS: btoa(JSON.stringify(givenLogos)),
      },
      writable: true,
    });

    // WHEN the Footer is rendered
    render(<Footer />);

    // THEN expect the footer and its label to be shown
    expect(screen.getByTestId(DATA_TEST_ID.FOOTER)).toBeInTheDocument();
    expect(screen.getByTestId(DATA_TEST_ID.FOOTER_LABEL)).toHaveTextContent("Developed in partnership with");
    // AND both logos to be shown, in order, with the configured/defaulted attributes
    const logos = screen.getAllByTestId(DATA_TEST_ID.FOOTER_LOGO);
    expect(logos).toHaveLength(givenLogos.length);
    expect(logos[0]).toHaveAttribute("src", "/world-bank-logo.svg");
    expect(logos[0]).toHaveAttribute("alt", "World Bank Group");
    expect(logos[0]).toHaveAttribute("height", "28");
    expect(logos[0]).toHaveAttribute("width", "80");
    expect(logos[1]).toHaveAttribute("src", "/tabiya-logo.svg");
    expect(logos[1]).toHaveAttribute("alt", "Partner logo 2");
    expect(logos[1]).toHaveAttribute("height", "30");
    expect(logos[1]).not.toHaveAttribute("width");
  });
});
