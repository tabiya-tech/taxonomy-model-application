// Based on https://testing-library.com/docs/react-testing-library/setup/

import React, { ReactElement } from "react";
import {render, renderHook, RenderOptions} from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import applicationTheme, { ThemeMode } from "src/theme/applicationTheme/applicationTheme";
import SnackbarProvider from "src/theme/SnackbarProvider/SnackbarProvider";
import { IsOnlineProvider } from "src/app/providers";
import {AuthProvider} from "../app/providers/AuthProvider";

type CustomRenderOptions = {
  useAuthProvider?: boolean
}

const AllTheProviders = ({ children, useAuthProvider = false }: { children: React.ReactNode } & CustomRenderOptions) => {
  const AuthProviderComponent = useAuthProvider ? AuthProvider : React.Fragment;

  return (
      <IsOnlineProvider>
        <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
            <AuthProviderComponent>
              <SnackbarProvider>{children}</SnackbarProvider>
            </AuthProviderComponent>
          </ThemeProvider>
      </IsOnlineProvider>
  );
};

type TOptions = Omit<RenderOptions, "wrapper"> & CustomRenderOptions
const customRender = (ui: ReactElement, options?: TOptions) =>
  render(ui, { wrapper: ({ children }) => <AllTheProviders useAuthProvider={options?.useAuthProvider}>{children}</AllTheProviders>, ...options });

const customRenderHook = (hook: () => any, options?: TOptions) =>
  renderHook(hook, { wrapper: ({ children }) => <AllTheProviders useAuthProvider={options?.useAuthProvider}>{children}</AllTheProviders>, ...options });

export * from "@testing-library/react";
export { customRender as render };
export { customRenderHook as renderHook };
