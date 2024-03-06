import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ImportStatusPropertyField, { uniqueId } from "./ImportStatusPropertyField";
import { ImportProcessStateEnums } from "api-specifications/importProcessState/enums";
import { v4 as id } from "uuid";

const meta: Meta<typeof ImportStatusPropertyField> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesContentPanels/ModelPropertiesImportExport/ImportTimeline/ImportStatusPropertyField",
  component: ImportStatusPropertyField,
  tags: ["autodocs"],
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  },
};

export default meta;

type Story = StoryObj<typeof ImportStatusPropertyField>;

export const Show = {
  render (_args: any) {
    return (
      <React.Fragment>
        <ImportStatusPropertyField importProcessState={Pending.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={Running.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={Completed.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={CompletedWithCriticalErrors.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={CompletedWithParsingErrors.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={CompletedWithParsingWarnings.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={CompletedWithParsingErrors.args?.importProcessState!} fieldId={id()} />
        <ImportStatusPropertyField importProcessState={CompletedWithParsingWarningsAndParsingErrors.args?.importProcessState!} fieldId={id()} />
      </React.Fragment>
     )
  }
}

export const Pending: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.PENDING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  }
}

export const Running: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.RUNNING,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  }
}

export const Completed: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  }
}

export const CompletedWithCriticalErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: true,
        parsingWarnings: false,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  }
}


export const CompletedWithParsingErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: false,
        parsingErrors: true
      }
    },
    fieldId: uniqueId
  }
}

export const CompletedWithParsingWarnings: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: true,
        parsingErrors: false
      }
    },
    fieldId: uniqueId
  }
}

export const CompletedWithParsingWarningsAndParsingErrors: Story = {
  args: {
    importProcessState: {
      id: id(),
      status: ImportProcessStateEnums.Status.COMPLETED,
      result: {
        errored: false,
        parsingWarnings: true,
        parsingErrors: true
      }
    },
    fieldId: uniqueId
  }
}
