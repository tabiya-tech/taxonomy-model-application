import type {Meta, StoryObj} from '@storybook/react';
import ImportProcessStateIcon from "./ImportProcessStateIcon";
import {getAllImportProcessStatePermutations} from "./_test_utilities/importProcesStateTestData";
import React from "react";

const meta: Meta<typeof ImportProcessStateIcon> = {
  title: 'ModelDirectory/ImportProcessStateIcon',
  component: ImportProcessStateIcon,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ImportProcessStateIcon>;

export const Shown: Story = {
  render: () => {
    return <ShowAllImportProcessStatePermutations/>;
  },
};

function ShowAllImportProcessStatePermutations() {
  return <>
    {getAllImportProcessStatePermutations().map((importProcessState) => {
      return <p key={importProcessState.id}>
        <ImportProcessStateIcon importProcessState={importProcessState}/>
        <span>{(() => {
          // @ts-ignore
          delete importProcessState.id;
          return JSON.stringify(importProcessState)
        })()
        }</span>
      </p>
    })}
    <p>
      {
        // @ts-ignore
        <ImportProcessStateIcon importProcessState={undefined}/>
      }
      <span>{"undefined"}</span>
    </p>

  </>;
}