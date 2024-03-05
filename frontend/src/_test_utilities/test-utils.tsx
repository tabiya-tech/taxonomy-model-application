// Based on https://testing-library.com/docs/react-testing-library/setup/

import React, { ReactElement } from "react";
import { render, RenderOptions, renderHook, RenderHookOptions } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import applicationTheme, { ThemeMode } from "src/theme/applicationTheme/applicationTheme";
import SnackbarProvider from "src/theme/SnackbarProvider/SnackbarProvider";
import { IsOnlineProvider } from "src/app/providers";

export const theme = applicationTheme(ThemeMode.LIGHT);

export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <IsOnlineProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </IsOnlineProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options });


function customRenderHook<TProps>(ui: () => TProps, options?: Omit<RenderHookOptions<TProps>, "wrapper">){
  return renderHook(ui, { wrapper: AllTheProviders, ...options });
}

export * from "@testing-library/react";

export { customRender as render };
export { customRenderHook as renderHook };
