import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Data is considered fresh for DEFAULT_STALE_TIME and is reused from the cache during this time.
// Once a query is no longer used, its data is kept in the cache for DEFAULT_UNUSED_DATA_EXPIRY
// before being removed. Both values can be overridden per query.
export const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const DEFAULT_UNUSED_DATA_EXPIRY = 15 * 60 * 1000; // 15 minutes

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_UNUSED_DATA_EXPIRY,
    },
  },
});

type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
