import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListSubheader,
  Collapse,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CircleIcon from "@mui/icons-material/Circle";
import InputAdornment from "@mui/material/InputAdornment";

const uniqueId = "a3f2c1d0-7e8b-4f9a-b5c6-2d1e0f3a4b5c";
export const DATA_TEST_ID = {
  EXPLORER_TREE_PANEL: `explorer-tree-panel-${uniqueId}`,
  EXPLORER_TREE_PANEL_TABS: `explorer-tree-panel-tabs-${uniqueId}`,
  EXPLORER_TREE_PANEL_TAB_OCCUPATIONS: `explorer-tree-panel-tab-occupations-${uniqueId}`,
  EXPLORER_TREE_PANEL_TAB_SKILLS: `explorer-tree-panel-tab-skills-${uniqueId}`,
  EXPLORER_TREE_PANEL_SEARCH: `explorer-tree-panel-search-${uniqueId}`,
  EXPLORER_TREE_PANEL_LIST: `explorer-tree-panel-list-${uniqueId}`,
  EXPLORER_TREE_PANEL_ITEM: `explorer-tree-panel-item-${uniqueId}`,
  EXPLORER_TREE_PANEL_GROUP: `explorer-tree-panel-group-${uniqueId}`,
  EXPLORER_TREE_PANEL_SKELETON: `explorer-tree-panel-skeleton-${uniqueId}`,
};

// Occupation roots split into the seen economy (ESCO / ISCO groups) and the unseen
// economy (ICATUS / local groups). Skills are shown as a flat list (no grouping).
const OCCUPATION_GROUPS: { label: string; objectType: string }[] = [
  { label: "Seen economy · ESCO", objectType: "iscogroup" },
  { label: "Unseen economy · ICATUS", objectType: "localgroup" },
];

export type ExplorerTreeItem = {
  id: string;
  code: string;
  title: string;
  objectType: string;
  hasChildren: boolean;
  isLoadingChildren?: boolean;
  children?: ExplorerTreeItem[];
};

type ExplorerTreePanelProps = {
  activeTab: "occupations" | "skills";
  onTabChange: (tab: "occupations" | "skills") => void;
  items: ExplorerTreeItem[];
  selectedItemId?: string;
  onSelectItem: (item: ExplorerTreeItem) => void;
  onExpandItem: (item: ExplorerTreeItem) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
};

type TreeNodeProps = {
  item: ExplorerTreeItem;
  selectedItemId?: string;
  onSelectItem: (item: ExplorerTreeItem) => void;
  onExpandItem: (item: ExplorerTreeItem) => void;
  depth: number;
};

const SKELETON_ROWS: { width: string; indent: number }[] = [
  { width: "70%", indent: 0 },
  { width: "55%", indent: 1 },
  { width: "60%", indent: 1 },
  { width: "75%", indent: 0 },
  { width: "50%", indent: 1 },
  { width: "65%", indent: 1 },
  { width: "48%", indent: 1 },
  { width: "72%", indent: 0 },
  { width: "58%", indent: 1 },
  { width: "63%", indent: 0 },
];

const TreeNode = ({ item, selectedItemId, onSelectItem, onExpandItem, depth }: Readonly<TreeNodeProps>) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.hasChildren;

  const expandIfNeeded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && item.children === undefined && !item.isLoadingChildren) {
      onExpandItem(item);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    expandIfNeeded();
  };

  const handleItemClick = () => {
    onSelectItem(item);
    if (hasChildren) {
      expandIfNeeded();
    }
  };

  let expandToggleIcon;
  if (!hasChildren) {
    expandToggleIcon = <CircleIcon sx={{ fontSize: 7, ml: 1, color: "text.disabled" }} />;
  } else if (expanded) {
    expandToggleIcon = <ExpandMoreIcon fontSize="small" color="action" />;
  } else {
    expandToggleIcon = <ChevronRightIcon fontSize="small" color="action" />;
  }

  return (
    <ListItem disablePadding sx={{ display: "block" }}>
      <ListItemButton
        divider
        selected={selectedItemId === item.id}
        onClick={handleItemClick}
        sx={{
          pl: 2 + depth * 2,
          "&.Mui-selected": {
            bgcolor: (theme) => theme.palette.containerBackground.main,
            "& .MuiListItemText-primary": {
              fontWeight: 700,
              color: "primary.main",
            },
          },
          "&.Mui-selected:hover": {
            bgcolor: (theme) => theme.palette.containerBackground.dark,
          },
        }}
        data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_ITEM}
      >
        <ListItemIcon sx={{ minWidth: 28 }} onClick={hasChildren ? handleExpandClick : undefined}>
          {expandToggleIcon}
        </ListItemIcon>
        <ListItemText
          primary={item.code ? `${item.code} · ${item.title}` : item.title}
          primaryTypographyProps={{ variant: "body1", noWrap: true }}
        />
      </ListItemButton>
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {item.isLoadingChildren || item.children === undefined ? (
            <Box display="flex" alignItems="center" py={0.75} pl={2 + (depth + 1) * 2}>
              <Skeleton variant="circular" width={10} height={10} sx={{ mr: 1.5, flexShrink: 0 }} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>
          ) : (
            <List disablePadding>
              {item.children.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem}
                  onExpandItem={onExpandItem}
                  depth={depth + 1}
                />
              ))}
            </List>
          )}
        </Collapse>
      )}
    </ListItem>
  );
};

const ExplorerTreePanel = ({
  activeTab,
  onTabChange,
  items,
  selectedItemId,
  onSelectItem,
  onExpandItem,
  searchValue,
  onSearchChange,
  isLoading = false,
}: Readonly<ExplorerTreePanelProps>) => {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      overflow="hidden"
      data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL}
    >
      <Box
        px={theme.fixedSpacing(theme.tabiyaSpacing.md)}
        pt={theme.fixedSpacing(theme.tabiyaSpacing.md)}
        flexShrink={0}
      >
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_e, val: "occupations" | "skills") => {
            if (val !== null) onTabChange(val);
          }}
          fullWidth
          size="small"
          disabled={isLoading}
          data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_TABS}
          sx={{
            backgroundColor: "grey.100",
            borderRadius: theme.tabiyaRounding.sm,
            p: theme.tabiyaSpacing.xs,
            gap: theme.tabiyaSpacing.sm,
            "& .MuiToggleButtonGroup-grouped": {
              border: "none !important",
              borderRadius: "8px !important",
              textTransform: "none",
              fontWeight: 500,
              fontSize: theme.typography.body1.fontSize,
              color: "text.secondary",
            },
            "& .MuiToggleButtonGroup-grouped.Mui-selected": {
              backgroundColor: "#ffffff",
              color: "text.primary",
              fontWeight: 600,
              boxShadow: "0px 1px 3px rgba(0,0,0,0.12)",
            },
            "& .MuiToggleButtonGroup-grouped.Mui-selected:hover": {
              backgroundColor: "#ffffff",
            },
            "& .MuiToggleButtonGroup-grouped:hover:not(.Mui-selected)": {
              backgroundColor: "grey.200",
            },
          }}
        >
          <ToggleButton value="occupations" data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_TAB_OCCUPATIONS}>
            Occupations
          </ToggleButton>
          <ToggleButton value="skills" data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_TAB_SKILLS}>
            Skills
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box p={theme.fixedSpacing(theme.tabiyaSpacing.md)} flexShrink={0}>
        <TextField
          fullWidth
          size="small"
          placeholder={activeTab === "occupations" ? "Search occupations..." : "Search skills..."}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_SEARCH}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
            },
          }}
        />
      </Box>
      <Box flex={1} overflow="auto">
        {isLoading && (
          <Box px={2} py={1} data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_SKELETON}>
            {SKELETON_ROWS.map((row) => (
              <Box key={`${row.width}-${row.indent}`} display="flex" alignItems="center" py={0.75} pl={row.indent * 3}>
                <Skeleton variant="circular" width={10} height={10} sx={{ mr: 1.5, flexShrink: 0 }} />
                <Skeleton variant="text" width={row.width} height={20} />
              </Box>
            ))}
          </Box>
        )}
        {!isLoading && items.length === 0 && (
          <Box px={2} py={2}>
            <Typography variant="body1" color="text.secondary">
              {activeTab === "occupations" ? "No occupations found" : "No skills found"}
            </Typography>
          </Box>
        )}
        {!isLoading && items.length > 0 && (
          <List
            disablePadding
            sx={{ borderTop: 1, borderColor: "divider" }}
            data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_LIST}
          >
            {activeTab === "occupations" ? (
              <>
                {OCCUPATION_GROUPS.map((group) => {
                  const groupItems = items.filter((item) => item.objectType === group.objectType);
                  if (groupItems.length === 0) return null;
                  return (
                    <React.Fragment key={group.label}>
                      <ListSubheader
                        disableSticky
                        data-testid={DATA_TEST_ID.EXPLORER_TREE_PANEL_GROUP}
                        sx={{
                          fontFamily: "IBM Plex Mono",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          fontSize: theme.typography.body1.fontSize,
                          color: (theme) => theme.palette.grey[600],
                          bgcolor: (theme) => theme.palette.grey[100],
                          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {group.label}
                      </ListSubheader>
                      {groupItems.map((item) => (
                        <TreeNode
                          key={item.id}
                          item={item}
                          selectedItemId={selectedItemId}
                          onSelectItem={onSelectItem}
                          onExpandItem={onExpandItem}
                          depth={0}
                        />
                      ))}
                    </React.Fragment>
                  );
                })}
                {/* Any items that aren't one of the known economy groups (e.g. leaves) render ungrouped. */}
                {items
                  .filter((item) => !OCCUPATION_GROUPS.some((group) => group.objectType === item.objectType))
                  .map((item) => (
                    <TreeNode
                      key={item.id}
                      item={item}
                      selectedItemId={selectedItemId}
                      onSelectItem={onSelectItem}
                      onExpandItem={onExpandItem}
                      depth={0}
                    />
                  ))}
              </>
            ) : (
              items.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem}
                  onExpandItem={onExpandItem}
                  depth={0}
                />
              ))
            )}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ExplorerTreePanel;
