import type { Meta, StoryObj } from "@storybook/react";
import ExportProcessStateIcon from "./ExportProcessStateIcon";
import { getAllExportProcessStatePermutations } from "./_test_utilities/exportProcesStateTestData";
import React from "react";

const meta: Meta<typeof ExportProcessStateIcon> = {
  title: "ModelDirectory/ExportProcessStateIcon",
  component: ExportProcessStateIcon,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ExportProcessStateIcon>;

export const Shown: Story = {
  render: () => {
    return <ShowAllExportProcessStatePermutations />;
  },
};

function ShowAllExportProcessStatePermutations() {
  return (
    <>
      {getAllExportProcessStatePermutations().map((exportProcessState) => {
        return (
          <p key={exportProcessState.id}>
            <ExportProcessStateIcon exportProcessState={exportProcessState} />
            <span>
              {(() => {
                // @ts-ignore
                delete exportProcessState.id;
                return JSON.stringify(exportProcessState);
              })()}
            </span>
          </p>
        );
      })}
      <p>
        {
          // @ts-ignore
          <ExportProcessStateIcon exportProcessState={undefined} />
        }
        <span>{"undefined"}</span>
      </p>
    </>
  );
}
