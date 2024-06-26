import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app";
import reportWebVitals from "./reportWebVitals";
import applicationTheme, { ThemeMode } from "./theme/applicationTheme/applicationTheme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import SnackbarProvider from "./theme/SnackbarProvider/SnackbarProvider";
import { IsOnlineProvider, AuthProvider } from "src/app/providers";

// Currently the fonts are downloaded from Google via the index.css
// Fonts could be distributed with the app instead, by explicitly importing them here

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <CssBaseline />
    <IsOnlineProvider>
      <ThemeProvider theme={applicationTheme(ThemeMode.LIGHT)}>
        <AuthProvider>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </AuthProvider>
      </ThemeProvider>
    </IsOnlineProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
