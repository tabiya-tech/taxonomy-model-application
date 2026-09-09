// mute the console
import "src/_test_utilities/consoleMock";

import { render, screen } from "@testing-library/react";
import {
  DEFAULT_STALE_TIME,
  DEFAULT_UNUSED_DATA_EXPIRY,
  queryClient,
  QueryProvider,
} from "src/app/providers/QueryProvider";
import { useQuery } from "@tanstack/react-query";

describe("QueryProvider", () => {
  test("should render children", () => {
    // GIVEN a child component
    const givenText = "foo";
    const GivenChild = () => <div data-testid="child">{givenText}</div>;

    // WHEN the child is rendered within the QueryProvider
    render(
      <QueryProvider>
        <GivenChild />
      </QueryProvider>
    );

    // THEN expect the child to be rendered
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toHaveTextContent(givenText);
  });

  test("should provide the shared queryClient to descendant components", () => {
    // GIVEN a child component that consumes a query
    const GivenChild = () => {
      const { data } = useQuery({
        queryKey: ["foo"],
        queryFn: () => Promise.resolve("bar"),
        initialData: "bar",
      });
      return <div data-testid="child">{data}</div>;
    };

    // WHEN the child is rendered within the QueryProvider
    render(
      <QueryProvider>
        <GivenChild />
      </QueryProvider>
    );

    // THEN expect the child to receive data from the queryClient without throwing
    expect(screen.getByTestId("child")).toHaveTextContent("bar");

    // AND expect the exported queryClient instance to have a cache entry for the query
    expect(queryClient.getQueryCache().find({ queryKey: ["foo"] })).toBeDefined();
  });

  test("should configure the queryClient with the expected default options", () => {
    // GIVEN the exported queryClient
    // WHEN the default query options are inspected
    const defaultOptions = queryClient.getDefaultOptions();

    // THEN expect the stale time to match the exported constant
    expect(defaultOptions.queries?.staleTime).toEqual(DEFAULT_STALE_TIME);

    // AND expect the gc time to match the exported constant
    expect(defaultOptions.queries?.gcTime).toEqual(DEFAULT_UNUSED_DATA_EXPIRY);

    // AND expect refetchOnWindowFocus to be left at the TanStack Query default (enabled)
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBeUndefined();
  });
});
