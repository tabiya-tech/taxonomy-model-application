import ExportApiSpecs from "api-specifications/export";

export const handler = async (event: ExportApiSpecs.Types.POST.Request.Payload): Promise<void> => {
  console.info("Export started", event);
};
