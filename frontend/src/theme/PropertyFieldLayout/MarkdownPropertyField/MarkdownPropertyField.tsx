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
  style?: React.CSSProperties;
}

const uniqueId = "0af822fc-07e3-4032-8276-d7ebf6dc4631";

export const DATA_TEST_ID = {
  MARKDOWN_PROPERTY_FIELD_TEXT: `markdown-property-field-text-${uniqueId}`,
};

enum UrnType {
  ESCO = "esco",
}

export const handleLink = (props: any) => {
  let href = props.href;

  if (href.startsWith("urn")) {
    const [, type, resource, uuid] = href.split(":");

    switch (type) {
      case UrnType.ESCO:
        href = `https://data.europa.eu/${type}/${resource}/${uuid}`;
        break;
      default:
        href = props.href;
    }
  } else {
    href = props.href;
  }

  return (
    <a {...props} target="_blank" rel="noreferrer noopener" href={href}>
      {props.children}
    </a>
  );
};

// Function to return the same URL without any transformation
// This is added to ensure that markdown supports URNs without altering them
// Markdown by default only supports http/https URLs, so this function allows URNs to be used as well
export const handleTransform = (url: string) => {
  return url;
};

const MarkdownPropertyField = (props: Readonly<MarkdownPropertyFieldProps>) => {
  return (
    <PropertyFieldLayout title={props.label ?? ""} data-testid={props["data-testid"]} fieldId={props?.fieldId ?? ""}>
      <Typography
        component="span"
        sx={{
          "& > *": { margin: "0" },
          ...props.style,
        }}
        data-testid={DATA_TEST_ID.MARKDOWN_PROPERTY_FIELD_TEXT}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={handleTransform}
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
