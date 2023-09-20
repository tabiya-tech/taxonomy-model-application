import React from 'react';

export interface AppLayoutStateType {
  contentHeader?: React.ReactNode;
  setContentHeader: React.Dispatch<
    React.SetStateAction<React.ReactNode>
  >;
}

export interface AppLayoutProviderProps {
  children: React.ReactNode;
}
