// Based on https://testing-library.com/docs/react-testing-library/setup/

import React, { ReactElement } from "react";
import { render, renderHook, RenderHookOptions, RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import applicationTheme, { ThemeMode } from "src/theme/applicationTheme/applicationTheme";
import SnackbarProvider from "src/theme/SnackbarProvider/SnackbarProvider";
import { IsOnlineProvider } from "src/app/providers";
import { AuthProvider } from "src/auth/AuthProvider";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <IsOnlineProvider>
      <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
        <AuthProvider>
          <SnackbarProvider>{children}</SnackbarProvider>
        </AuthProvider>
      </ThemeProvider>
    </IsOnlineProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });

function customRenderHook<T>(hook: () => T, options?: Omit<RenderHookOptions<T>, "wrapper">) {
  return renderHook(hook, { wrapper: AllTheProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
export { customRenderHook as renderHook };
