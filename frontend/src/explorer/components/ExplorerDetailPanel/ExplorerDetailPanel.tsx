import { useState } from "react";
import Box from "@mui/material/Box";
import { Typography, Divider, Skeleton, Tabs, Tab, Chip } from "@mui/material";
import { ExplorerRelatedOccupation, ExplorerRelatedSkill, ObjectType } from "src/explorer/explorer.types";

const uniqueId = "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a";
export const DATA_TEST_ID = {
  EXPLORER_DETAIL_PANEL: `explorer-detail-panel-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_EMPTY: `explorer-detail-panel-empty-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_CODE: `explorer-detail-panel-code-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_TITLE: `explorer-detail-panel-title-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_SKELETON: `explorer-detail-panel-skeleton-${uniqueId}`,
};

export type ExplorerDetailItem = {
  id: string;
  code: string;
  title: string;
  objectType?: ObjectType;
  definition?: string;
  altLabels?: string[];
  UUID?: string;
  occupationType?: string;
  occupationGroupCode?: string;
  regulatedProfessionNote?: string;
  skillType?: string;
  reuseLevel?: string;
  requiresSkills?: ExplorerRelatedSkill[];
  requiredByOccupations?: ExplorerRelatedOccupation[];
};

type ExplorerDetailPanelProps = {
  item: ExplorerDetailItem | null;
  isLoading?: boolean;
};

const GROUP_OBJECT_TYPES = new Set([ObjectType.ISCOGroup, ObjectType.LocalGroup, ObjectType.SkillGroup]);
const OCCUPATION_OBJECT_TYPES = new Set([ObjectType.ESCOOccupation, ObjectType.LocalOccupation]);

const humanize = (value: string): string =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1).replace(/[-/]/g, " ");

const DetailSkeleton = () => (
  <Box
    display="flex"
    flexDirection="column"
    height="100%"
    overflow="hidden"
    data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_SKELETON}
  >
    <Box display="flex" alignItems="flex-start" gap={2} px={3} py={2.5} flexShrink={0}>
      <Skeleton variant="text" width={80} height={44} />
      <Skeleton variant="text" width={300} height={44} />
    </Box>
    <Divider />
    <Box display="flex" gap={1} px={2} pt={0.5} flexShrink={0}>
      <Skeleton variant="text" width={88} height={44} />
      <Skeleton variant="text" width={60} height={44} />
      <Skeleton variant="text" width={68} height={44} />
      <Skeleton variant="text" width={68} height={44} />
    </Box>
    <Box px={3} pt={2} display="flex" flexDirection="column" gap={1.5}>
      <Skeleton variant="text" width={80} height={20} />
      <Skeleton variant="text" width="90%" height={18} />
      <Skeleton variant="text" width="85%" height={18} />
      <Skeleton variant="text" width="60%" height={18} />
    </Box>
  </Box>
);

const RelatedItemRow = ({ item }: Readonly<{ item: ExplorerRelatedSkill | ExplorerRelatedOccupation }>) => (
  <Box bgcolor="grey.100" borderRadius={1} px={2} py={1.5} mb={1}>
    <Typography variant="body2">{item.preferredLabel}</Typography>
  </Box>
);

const LinksTabContent = ({ item }: Readonly<{ item: ExplorerDetailItem }>) => {
  const essential = item.requiresSkills?.filter((s) => s.relationType === "essential") ?? [];
  const optional = item.requiresSkills?.filter((s) => s.relationType === "optional") ?? [];
  const requiredBy = item.requiredByOccupations ?? [];

  if (essential.length === 0 && optional.length === 0 && requiredBy.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No links available for this item.
      </Typography>
    );
  }

  return (
    <>
      {essential.length > 0 && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              ESSENTIAL SKILLS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {essential.length} skills
            </Typography>
          </Box>
          {essential.map((skill) => (
            <RelatedItemRow key={skill.id} item={skill} />
          ))}
        </Box>
      )}
      {optional.length > 0 && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              OPTIONAL SKILLS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {optional.length} skills
            </Typography>
          </Box>
          {optional.map((skill) => (
            <RelatedItemRow key={skill.id} item={skill} />
          ))}
        </Box>
      )}
      {requiredBy.length > 0 && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary">
              REQUIRED BY OCCUPATIONS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {requiredBy.length} occupations
            </Typography>
          </Box>
          {requiredBy.map((occupation) => (
            <RelatedItemRow key={occupation.id} item={occupation} />
          ))}
        </Box>
      )}
    </>
  );
};

const buildDetailRows = (item: ExplorerDetailItem): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = [];
  const objectType = item.objectType;

  if (objectType && OCCUPATION_OBJECT_TYPES.has(objectType)) {
    rows.push({
      label: "Occupation type",
      value: objectType === ObjectType.ESCOOccupation ? "ESCO occupation" : "Local occupation",
    });
    if (item.occupationGroupCode) rows.push({ label: "ISCO group", value: item.occupationGroupCode });
    if (item.code) rows.push({ label: "ESCO code", value: item.code });
    rows.push({ label: "Regulated profession", value: item.regulatedProfessionNote ? "Yes" : "No" });
  } else if (objectType && GROUP_OBJECT_TYPES.has(objectType)) {
    const groupTypeLabel =
      objectType === ObjectType.SkillGroup
        ? "Skill group"
        : objectType === ObjectType.ISCOGroup
        ? "ISCO group"
        : "Local group";
    rows.push({ label: "Group type", value: groupTypeLabel });
    if (item.code) rows.push({ label: "Code", value: item.code });
  } else if (objectType === ObjectType.Skill) {
    if (item.skillType) rows.push({ label: "Skill type", value: humanize(item.skillType) });
    if (item.reuseLevel) rows.push({ label: "Reuse level", value: humanize(item.reuseLevel) });
  }

  rows.push({ label: "Alternative labels", value: String(item.altLabels?.length ?? 0) });
  if (item.UUID) rows.push({ label: "UUID", value: item.UUID });

  return rows;
};

const DetailsTabContent = ({ item }: Readonly<{ item: ExplorerDetailItem }>) => {
  const rows = buildDetailRows(item);
  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} columnGap={4} rowGap={2}>
      {rows.map((row) => (
        <Box
          key={row.label}
          display="flex"
          justifyContent="space-between"
          gap={2}
          borderBottom={1}
          borderColor="divider"
          pb={1}
        >
          <Typography variant="body2" color="text.secondary" flexShrink={0}>
            {row.label}
          </Typography>
          <Typography variant="body2" fontWeight="bold" textAlign="right" sx={{ wordBreak: "break-all" }}>
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const TAB_LABELS = ["Definition", "Links", "Details", "History"];

const ExplorerDetailPanel = ({ item, isLoading = false }: Readonly<ExplorerDetailPanelProps>) => {
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!item) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
        data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_EMPTY}
      >
        <Typography variant="body1" color="text.secondary">
          Select an item to view its details
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
      data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL}
    >
      <Box display="flex" alignItems="flex-start" gap={2} px={3} py={2.5} flexShrink={0}>
        <Typography
          variant="h5"
          color="grey.500"
          fontWeight={400}
          sx={{ flexShrink: 0, lineHeight: 1.4 }}
          data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CODE}
        >
          {item.code}
        </Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          color="primary"
          data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_TITLE}
        >
          {item.title}
        </Typography>
      </Box>
      <Divider />
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        TabIndicatorProps={{
          sx: {
            backgroundColor: "success.dark",
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          },
        }}
        sx={{
          flexShrink: 0,
          px: 1,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minWidth: 80,
            color: "text.secondary",
            "&.Mui-selected": {
              color: "success.dark",
            },
          },
        }}
      >
        {TAB_LABELS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      <Box flex={1} overflow="auto" px={3} py={2}>
        {activeTab === 0 && (
          <>
            <Typography variant="body2" fontWeight="bold" mb={1}>
              Description
            </Typography>
            <Typography variant="body2">{item.definition || "No definition available"}</Typography>
            {item.altLabels && item.altLabels.length > 0 && (
              <>
                <Typography variant="body2" fontWeight="bold" mt={3} mb={1}>
                  Also known as
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {item.altLabels.map((label) => (
                    <Chip key={label} label={label} size="small" sx={{ bgcolor: "grey.100" }} />
                  ))}
                </Box>
              </>
            )}
          </>
        )}
        {activeTab === 1 && <LinksTabContent item={item} />}
        {activeTab === 2 && <DetailsTabContent item={item} />}
        {activeTab === 3 && (
          <Typography variant="body2" color="text.secondary">
            History is not yet available.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ExplorerDetailPanel;
