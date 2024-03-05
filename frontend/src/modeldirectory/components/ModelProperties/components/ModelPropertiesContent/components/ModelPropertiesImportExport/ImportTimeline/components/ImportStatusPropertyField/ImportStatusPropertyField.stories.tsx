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
