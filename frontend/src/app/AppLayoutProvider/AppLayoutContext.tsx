import React, { createContext, useContext } from 'react';

const defaultAppLayoutState: {
  // make it easy to manage other logic on the component level
  contentHeader?: React.ReactNode;
  setContentHeader: React.Dispatch<
    React.SetStateAction<React.ReactNode>
  >;
} = {
  setContentHeader: () => {},
};

export const AppLayoutContext = createContext(
  defaultAppLayoutState
);

export const useAppLayout = () => {
  return useContext(AppLayoutContext);
};