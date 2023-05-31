// Based on https://testing-library.com/docs/react-testing-library/setup/

import React, {ReactElement} from 'react'
import {render, RenderOptions} from '@testing-library/react'
import {ThemeProvider} from "@mui/material";
import applicationTheme from "src/theme/applicationTheme";

const AllTheProviders = ({children}: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={applicationTheme}>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, {wrapper: AllTheProviders, ...options})

export * from '@testing-library/react'
export {customRender as render}