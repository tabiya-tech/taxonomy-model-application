import React, { useState, createContext, useContext } from 'react';
import {AppLayoutProviderProps, AppLayoutStateType} from './app.type'

export const AppLayoutContext = createContext<
  AppLayoutStateType | undefined
>(undefined);


export const useAppLayout = () => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error(
      'useAppLayout must be used within an AppLayoutProvider'
    );
  }
  return context;
};


export const AppLayoutProvider: React.FC<
  AppLayoutProviderProps
> = ({ children }) => {
  const [contentHeader, setContentHeader] =
    useState<React.ReactNode>();

  return (
    <AppLayoutContext.Provider
      value={{ contentHeader, setContentHeader }}
    >
      {children}
    </AppLayoutContext.Provider>
  );
};

export default AppLayoutProvider;