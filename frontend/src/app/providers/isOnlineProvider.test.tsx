import { IsOnlineContext, IsOnlineProvider } from "./IsOnlineProvider";
import { screen, render, waitFor } from "@testing-library/react";
import { useContext } from "react";
import * as React from "react";
import { unmockBrowserIsOnLine, mockBrowserIsOnLine } from "src/_test_utilities/mockBrowserIsOnline";

describe("isOnlineProvider", () => {
  beforeEach(() => {
    unmockBrowserIsOnLine();
  });
  test("children should get context isOnline = true when the internet is online", async () => {
    // GIVEN that the internet is online
    mockBrowserIsOnLine(true);

    // WHEN the child component is rendered
    render(
      <IsOnlineProvider>
        <MockChild />
      </IsOnlineProvider>
    );

    // THEN expect the child to receive isOnline = true
    expect(screen.getByTestId("child")).toHaveTextContent("online");
  });

  test("children should get context isOnline = false when the internet is offline", async () => {
    // GIVEN that the internet is offline
    mockBrowserIsOnLine(false);

    // WHEN the child component is rendered
    render(
      <IsOnlineProvider>
        <MockChild />
      </IsOnlineProvider>
    );

    // THEN expect the child to receive isOnline = false
    expect(screen.getByTestId("child")).toHaveTextContent("offline");
  });

  test("children should get context isOnline = true when the internet switches from offline to online", async () => {
    // GIVEN that the internet is offline
    mockBrowserIsOnLine(false);

    // WHEN the child component is rendered
    render(
      <IsOnlineProvider>
        <MockChild />
      </IsOnlineProvider>
    );

    // THEN expect the child to receive isOnline = false
    expect(screen.getByTestId("child")).toHaveTextContent("offline");

    // WHEN the internet goes online
    mockBrowserIsOnLine(true);

    // THEN expect the child to receive isOnline = true
    await waitFor(() => {
      expect(screen.getByTestId("child")).toHaveTextContent("online");
    });
  });

  test("children should get context isOnline = false when the internet switches from online to offline", async () => {
    // GIVEN that the internet is online
    mockBrowserIsOnLine(true);

    // WHEN the child component is rendered
    render(
      <IsOnlineProvider>
        <MockChild />
      </IsOnlineProvider>
    );

    // THEN expect the child to receive isOnline = true
    expect(screen.getByTestId("child")).toHaveTextContent("online");

    // WHEN the internet goes offline
    mockBrowserIsOnLine(false);

    // THEN expect the child to receive isOnline = false
    await waitFor(() => {
      expect(screen.getByTestId("child")).toHaveTextContent("offline");
    });
  });
});

const MockChild = () => {
  const isOnline = useContext(IsOnlineContext);
  return <div data-testid="child">{isOnline ? "online" : "offline"}</div>;
};
