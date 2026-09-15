import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ImportStatusPropertyField, { uniqueId } from "./ImportStatusPropertyField";
import { v4 as id } from "uuid";
import { IMPORT_PROCESS_STATUS } from "src/api-types";

const meta: Meta<typeof ImportStatusPropertyField> = {
  title:
    "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExportComponents/ImportStatusPropertyField",
  component: ImportStatusPropertyField,
  tags: ["autodocs"],
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.PENDING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export default meta;

type Story = StoryObj<typeof ImportStatusPropertyField>;

export const Shown = {
  render(_args: any) {
    return (
      <React.Fragment>
        <ImportStatusPropertyField importProcessState={Pending.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={Running.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={Completed.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField
          importProcessState={CompletedWithCriticalErrors.args?.importProcessState!}
          fieldId={id()}
        />
        <ImportStatusPropertyField
          importProcessState={CompletedWithParsingWarnings.args?.importProcessState!}
          fieldId={id()}
        />
        <ImportStatusPropertyField
          importProcessState={CompletedWithParsingErrors.args?.importProcessState!}
          fieldId={id()}
        />
        <ImportStatusPropertyField
          importProcessState={CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState!}
          fieldId={id()}
        />
      </React.Fragment>
    );
  },
};

export const Pending: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.PENDING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export const Running: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.RUNNING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export const Completed: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithCriticalErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.COMPLETED,
      result: {
        errored: true,
        parsingWarnings: false,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithParsingErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: true,
      },
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithParsingWarnings: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: true,
        parsingErrors: false,
      },
    },
    fieldId: uniqueId,
  },
};

export const CompletedWithParsingWarningsAndParsingErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: IMPORT_PROCESS_STATUS.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: true,
        parsingErrors: true,
      },
    },
    fieldId: uniqueId,
  },
};
