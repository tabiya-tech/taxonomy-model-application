import { Typography } from "@mui/material";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";

export interface MarkdownPropertyFieldProps {
  label?: string;
  text: string;
  "data-testid"?: string;
  fieldId?: string;
}

const uniqueId = "0af822fc-07e3-4032-8276-d7ebf6dc4631";

export const DATA_TEST_ID = {
  MARKDOWN_PROPERTY_FIELD_TEXT: `markdown-property-field-text-${uniqueId}`,
};

const handleLink = (props: any) => {
  return (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {props.children}
    </a>
  );
};

const MarkdownPropertyField = (props: Readonly<MarkdownPropertyFieldProps>) => {
  return (
    <PropertyFieldLayout title={props.label ?? ""} data-testid={props["data-testid"]} fieldId={props?.fieldId ?? ""}>
      <Typography sx={{ "& > *": { margin: "0" } }} data-testid={DATA_TEST_ID.MARKDOWN_PROPERTY_FIELD_TEXT}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: handleLink,
          }}
        >
          {props.text}
        </ReactMarkdown>
      </Typography>
    </PropertyFieldLayout>
  );
};

export default MarkdownPropertyField;
