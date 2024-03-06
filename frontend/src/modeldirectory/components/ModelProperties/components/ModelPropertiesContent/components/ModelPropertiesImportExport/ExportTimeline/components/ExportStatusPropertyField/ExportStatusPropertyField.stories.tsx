import React from "react";
import ExportStatusPropertyField, { uniqueId } from "./ExportStatusPropertyField";
import { v4 as id } from "uuid";
import { Meta, StoryObj } from "@storybook/react";
import { ExportProcessStateEnums } from "api-specifications/exportProcessState/enums";

const meta: Meta<typeof ExportStatusPropertyField> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ExportStatusPropertyField",
  component: ExportStatusPropertyField,
  tags: ["autodocs"],
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export default meta;

type Story = StoryObj<typeof ExportStatusPropertyField>;

export const Shown: Story = {
  render(_args: any) {
    return (
      <React.Fragment>
        <ExportStatusPropertyField exportProcessState={Pending.args?.exportProcessState!} fieldId={id()} />
        <ExportStatusPropertyField exportProcessState={Running.args?.exportProcessState!} fieldId={id()} />
        <ExportStatusPropertyField exportProcessState={Completed.args?.exportProcessState!} fieldId={id()} />
        <ExportStatusPropertyField
          exportProcessState={CompletedWithCriticalErrors.args?.exportProcessState!}
          fieldId={id()}
        />
        <ExportStatusPropertyField
          exportProcessState={CompletedWithExportErrors.args?.exportProcessState!}
          fieldId={id()}
        />
        <ExportStatusPropertyField
          exportProcessState={CompletedWithExportWarnings.args?.exportProcessState!}
          fieldId={id()}
        />
        <ExportStatusPropertyField
          exportProcessState={CompletedWithExportWarningsAndExportErrors.args?.exportProcessState!}
          fieldId={id()}
        />
      </React.Fragment>
    );
  },
};

export const Pending: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const Running: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.RUNNING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const Completed: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithCriticalErrors: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: true,
        exportWarnings: false,
        exportErrors: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithExportErrors: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportWarnings: false,
        exportErrors: true,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithExportWarnings: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportWarnings: true,
        exportErrors: false,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithExportWarningsAndExportErrors: Story = {
  args: {
    exportProcessState: {
      id: id(),
      status: ExportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        exportWarnings: true,
        exportErrors: true,
      },
      downloadUrl: "https://www.example.com/",
      timestamp: new Date("2024-02-18T17:35:10.571Z"),
      createdAt: new Date("2024-02-18T17:35:10.571Z"),
      updatedAt: new Date(),
    },
    fieldId: uniqueId,
  },
};
