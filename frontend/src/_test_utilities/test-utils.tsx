// Based on https://testing-library.com/docs/react-testing-library/setup/

import React, {ReactElement} from 'react'
import {render, RenderOptions} from '@testing-library/react'
import {ThemeProvider} from "@mui/material";
import applicationTheme, {ThemeMode} from "src/theme/applicationTheme";
import SnackbarProvider from "src/theme/SnackbarProvider/SnackbarProvider";

const AllTheProviders = ({children}: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
      <SnackbarProvider>
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: AllTheProviders, ...options})

export * from '@testing-library/react'
export {customRender as render}