import { useState } from "react";
import Box from "@mui/material/Box";
import { Typography, Divider, Skeleton, Tabs, Tab, Chip, useTheme } from "@mui/material";
import {
  ExplorerContainedItem,
  ExplorerRelatedOccupation,
  ExplorerRelatedSkill,
  ObjectType,
} from "src/explorer/explorer.types";

const uniqueId = "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a";
export const DATA_TEST_ID = {
  EXPLORER_DETAIL_PANEL: `explorer-detail-panel-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_EMPTY: `explorer-detail-panel-empty-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_CODE: `explorer-detail-panel-code-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_TITLE: `explorer-detail-panel-title-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_SKELETON: `explorer-detail-panel-skeleton-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_CONTAINS: `explorer-detail-panel-contains-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_BADGE: `explorer-detail-panel-badge-${uniqueId}`,
  EXPLORER_DETAIL_PANEL_ALT_LABELS: `explorer-detail-panel-alt-labels-${uniqueId}`,
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
  contains?: ExplorerContainedItem[];
  requiresSkills?: ExplorerRelatedSkill[];
  requiredByOccupations?: ExplorerRelatedOccupation[];
};

type ExplorerDetailPanelProps = {
  item: ExplorerDetailItem | null;
  isLoading?: boolean;
};

const GROUP_OBJECT_TYPES = new Set([ObjectType.ISCOGroup, ObjectType.LocalGroup, ObjectType.SkillGroup]);

const isGroup = (objectType?: ObjectType): boolean => Boolean(objectType && GROUP_OBJECT_TYPES.has(objectType));

const isOccupation = (objectType?: ObjectType): boolean =>
  objectType === ObjectType.ESCOOccupation || objectType === ObjectType.LocalOccupation;

// The colored "flag" shown under the title, indicating the entity's category.
const getBadge = (item: ExplorerDetailItem): { label: string; bgcolor: string; color: string } | null => {
  const objectType = item.objectType;
  if (!objectType) return null;
  if (GROUP_OBJECT_TYPES.has(objectType)) return { label: "Group", bgcolor: "#E6F4EA", color: "#2E7D32" };
  if (objectType === ObjectType.ESCOOccupation) return { label: "Seen Economy", bgcolor: "#E7F0FB", color: "#265EA7" };
  if (objectType === ObjectType.LocalOccupation)
    return { label: "Unseen Economy", bgcolor: "#FBEEDD", color: "#B26A00" };
  if (objectType === ObjectType.Skill) {
    const label = item.skillType ? item.skillType.charAt(0).toUpperCase() + item.skillType.slice(1) : "Skill";
    return { label, bgcolor: "#F3E8FB", color: "#7B1FA2" };
  }
  return null;
};

// The label of the second (links) tab depends on the entity: occupations link to skills and vice-versa.
const linksTabLabel = (objectType?: ObjectType): string => {
  if (isOccupation(objectType)) return "Skills linked";
  if (objectType === ObjectType.Skill) return "Occupations linked";
  return "Links";
};

const typeLabel = (objectType?: ObjectType): string => {
  switch (objectType) {
    case ObjectType.ISCOGroup:
    case ObjectType.LocalGroup:
      return "Occupation group";
    case ObjectType.SkillGroup:
      return "Skill group";
    case ObjectType.ESCOOccupation:
      return "ESCO occupation";
    case ObjectType.LocalOccupation:
      return "Local occupation";
    case ObjectType.Skill:
      return "Skill";
    default:
      return "—";
  }
};

const DetailSkeleton = () => (
  <Box display="flex" flexDirection="column" data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_SKELETON}>
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
  <Box
    bgcolor="grey.100"
    borderRadius={1}
    px={(theme) => theme.fixedSpacing(1.5)}
    py={(theme) => theme.fixedSpacing(1.2)}
    mb={(theme) => theme.fixedSpacing(1.5)}
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    gap={2}
  >
    <Typography variant="body2">{item.preferredLabel}</Typography>
    {item.code && (
      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "IBM Plex Mono", flexShrink: 0 }}>
        {item.code}
      </Typography>
    )}
  </Box>
);

const LinkSectionHeader = ({ label, count }: Readonly<{ label: string; count: number }>) => (
  <Typography
    variant="caption"
    sx={{
      display: "block",
      mb: 1,
      fontFamily: "IBM Plex Mono",
      fontWeight: 700,
      textTransform: "uppercase",
      color: "primary.main",
    }}
  >
    {label} · {count}
  </Typography>
);

const DefinitionTabContent = ({ item }: Readonly<{ item: ExplorerDetailItem }>) => {
  const theme = useTheme();
  const contains = item.contains ?? [];
  const altLabels = (item.altLabels ?? []).filter(
    (label) => label.trim().toLowerCase() !== item.title.trim().toLowerCase()
  );
  return (
    <>
      <Typography variant="body1" fontWeight="bold" mb={1}>
        Description
      </Typography>
      <Typography variant="body1">{item.definition || "No definition available"}</Typography>
      {altLabels.length > 0 && (
        <Box data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_ALT_LABELS}>
          <Typography variant="body1" fontWeight="bold" mt={3} mb={1}>
            Also known as
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {altLabels.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                sx={{
                  bgcolor: "grey.100",
                  fontSize: theme.typography.body2.fontSize,
                  px: theme.fixedSpacing(theme.tabiyaSpacing.sm),
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      {isGroup(item.objectType) && (
        <Box data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CONTAINS}>
          <Typography variant="body1" fontWeight="bold" mt={3} mb={1}>
            Contains · {contains.length}
          </Typography>
          {contains.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              Empty group.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={theme.fixedSpacing(1.5)}>
              {contains.map((child) => (
                <Box
                  key={child.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                  bgcolor="grey.100"
                  borderRadius={1}
                  px={theme.fixedSpacing(1.5)}
                  py={theme.fixedSpacing(1.2)}
                >
                  <Typography variant="body2">{child.title}</Typography>
                  {child.code && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "IBM Plex Mono", flexShrink: 0 }}
                    >
                      {child.code}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

const LinksTabContent = ({ item }: Readonly<{ item: ExplorerDetailItem }>) => {
  const essential = item.requiresSkills?.filter((s) => s.relationType === "essential") ?? [];
  const optional = item.requiresSkills?.filter((s) => s.relationType === "optional") ?? [];
  const requiredBy = item.requiredByOccupations ?? [];

  if (essential.length === 0 && optional.length === 0 && requiredBy.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        No links available for this item.
      </Typography>
    );
  }

  return (
    <>
      {essential.length > 0 && (
        <Box mb={3}>
          <LinkSectionHeader label="Essential skills" count={essential.length} />
          {essential.map((skill) => (
            <RelatedItemRow key={skill.id} item={skill} />
          ))}
        </Box>
      )}
      {optional.length > 0 && (
        <Box mb={3}>
          <LinkSectionHeader label="Optional skills" count={optional.length} />
          {optional.map((skill) => (
            <RelatedItemRow key={skill.id} item={skill} />
          ))}
        </Box>
      )}
      {requiredBy.length > 0 && (
        <Box mb={3}>
          <LinkSectionHeader label="Occupations requiring this skill" count={requiredBy.length} />
          {requiredBy.map((occupation) => (
            <RelatedItemRow key={occupation.id} item={occupation} />
          ))}
        </Box>
      )}
    </>
  );
};

const DetailsTabContent = ({ item }: Readonly<{ item: ExplorerDetailItem }>) => {
  const rows: { label: string; value: string }[] = [
    { label: "Type", value: typeLabel(item.objectType) },
    { label: "Code", value: item.code || "—" },
  ];
  if (isGroup(item.objectType)) {
    rows.push({ label: "Children", value: String(item.contains?.length ?? 0) });
  }
  rows.push({ label: "Alternative labels", value: String(item.altLabels?.length ?? 0) });

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} columnGap={4} rowGap={2}>
      {rows.map((row) => (
        <Box
          key={row.label}
          display="flex"
          justifyContent="space-between"
          gap={(theme) => theme.fixedSpacing(2)}
          borderBottom={1}
          borderColor="divider"
          pb={(theme) => theme.fixedSpacing(1)}
        >
          <Typography variant="body1" color="text.secondary" flexShrink={0}>
            {row.label}
          </Typography>
          <Typography variant="body1" fontWeight="bold" textAlign="right" sx={{ wordBreak: "break-all" }}>
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// History is not implemented on the frontend yet — the tab shows a placeholder for now.
const HistoryTabContent = () => (
  <Typography variant="body1" color="text.secondary">
    No history available.
  </Typography>
);

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
        minHeight={240}
        data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_EMPTY}
      >
        <Typography variant="body1" color="text.secondary">
          Select an item to view its details
        </Typography>
      </Box>
    );
  }

  const badge = getBadge(item);
  const tabLabels = ["Definition", linksTabLabel(item.objectType), "Details", "History"];

  return (
    <Box display="flex" flexDirection="column" data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL}>
      <Box display="flex" alignItems="flex-start" gap={2} px={3} pt={2.5} pb={badge ? 1 : 2.5} flexShrink={0}>
        <Typography
          variant="h5"
          color="grey.500"
          fontWeight={400}
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
      {badge && (
        <Box px={3} pb={2} flexShrink={0}>
          <Chip
            label={badge.label}
            size="small"
            data-testid={DATA_TEST_ID.EXPLORER_DETAIL_PANEL_BADGE}
            sx={{
              bgcolor: badge.bgcolor,
              color: badge.color,
              fontWeight: 600,
              height: 20,
              fontSize: "0.68rem",
              borderRadius: 2,
              border: "1px solid",
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Box>
      )}
      <Divider />
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
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
        {tabLabels.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      <Box flex={1} p={3}>
        {activeTab === 0 && <DefinitionTabContent item={item} />}
        {activeTab === 1 && <LinksTabContent item={item} />}
        {activeTab === 2 && <DetailsTabContent item={item} />}
        {activeTab === 3 && <HistoryTabContent />}
      </Box>
    </Box>
  );
};

export default ExplorerDetailPanel;
