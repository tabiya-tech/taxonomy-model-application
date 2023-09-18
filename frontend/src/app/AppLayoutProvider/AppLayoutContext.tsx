import React, { createContext, useContext } from 'react';

type AppLayoutStateType = {
  contentHeader?: React.ReactNode;
  setContentHeader: React.Dispatch<
    React.SetStateAction<React.ReactNode>
  >;
};
const defaultAppLayoutState: AppLayoutStateType = {
  setContentHeader: () => {},
};

export const AppLayoutContext = createContext<AppLayoutStateType>(
  defaultAppLayoutState
);

export const useAppLayout = () => {
  return useContext(AppLayoutContext);
};