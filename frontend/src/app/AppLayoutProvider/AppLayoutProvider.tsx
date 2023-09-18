import React, { useState } from 'react';
import { AppLayoutContext } from './AppLayoutContext';

type AppLayoutProviderProps = {
  children: React.ReactNode;
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