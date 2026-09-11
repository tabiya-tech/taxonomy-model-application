import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, generatePath } from "react-router-dom";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import { useModels } from "src/modelInfo/useModels";
import { ObjectType } from "src/explorer/explorer.types";
import {
  useExplorerChildren,
  useExplorerItemDetail,
  useExplorerItemHistory,
  useExplorerTree,
} from "src/explorer/useExplorerQueries";
import { ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";
import { getLatestSuccessfulExport } from "src/modeldirectory/components/ModelsCardList/components/VersionRow/VersionRow";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";
import { routerPaths } from "src/app/routerPaths";
import ExplorerHeader from "src/explorer/components/ExplorerHeader/ExplorerHeader";
import ExplorerTreePanel, { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import ExplorerDetailPanel, {
  ExplorerDetailItem,
} from "src/explorer/components/ExplorerDetailPanel/ExplorerDetailPanel";

const uniqueId = "5e7f2b3a-8c4d-4a1b-9e6f-3d2c1b0a4e5f";
export const DATA_TEST_ID = {
  EXPLORER_PAGE: `explorer-page-${uniqueId}`,
};

// Debounce so search doesn't fire a request on every keystroke.
const SEARCH_DEBOUNCE_MS = 300;

const findItemById = (items: ExplorerTreeItem[], id: string): ExplorerTreeItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

// Attaches each expanded node's cached children (if loaded) into the base tree for display,
// without mutating any query cache data.
const mergeChildrenIntoTree = (
  items: ExplorerTreeItem[],
  childrenByItemId: Map<string, { data?: ExplorerTreeItem[]; isLoading: boolean }>
): ExplorerTreeItem[] =>
  items.map((item) => {
    const expanded = childrenByItemId.get(item.id);
    if (!expanded) return item;
    const children = expanded.data ? mergeChildrenIntoTree(expanded.data, childrenByItemId) : item.children;
    return { ...item, isLoadingChildren: expanded.isLoading, children };
  });

type ExplorerPageProps = {
  initialTab?: "occupations" | "skills";
};

const ExplorerPage = ({ initialTab = "occupations" }: ExplorerPageProps) => {
  const theme = useTheme();
  const { modelId, occupationId, skillId } = useParams<{
    modelId: string;
    occupationId?: string;
    skillId?: string;
  }>();
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [expandedItems, setExpandedItems] = useState<ExplorerTreeItem[]>([]);
  const [historyTabOpenedForItemId, setHistoryTabOpenedForItemId] = useState<string | null>(null);

  const { data: models = [], isPending: isLoadingModels, isError: isModelsError, error: modelsError } = useModels();

  useEffect(() => {
    if (isModelsError) {
      if (modelsError instanceof ServiceError) writeServiceErrorToLog(modelsError, console.error);
      else console.error(modelsError);
    }
  }, [isModelsError, modelsError]);

  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchValue(searchValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const trimmedSearchValue = debouncedSearchValue.trim();

  const {
    data: rootTreeItems = [],
    isPending: isTreeLoading,
    isError: isTreeError,
    error: treeError,
  } = useExplorerTree(modelId, initialTab, trimmedSearchValue);

  useEffect(() => {
    if (isTreeError) {
      if (treeError instanceof ServiceError) writeServiceErrorToLog(treeError, console.error);
      else console.error(treeError);
    }
  }, [isTreeError, treeError]);

  // Expanded nodes reset whenever the tab or search changes, since they refer to a tree that no
  // longer exists once its root/search results are replaced.
  useEffect(() => {
    setExpandedItems([]);
  }, [modelId, initialTab, trimmedSearchValue]);

  const childrenResults = useExplorerChildren(modelId, expandedItems);

  const childrenByItemId = useMemo(() => {
    const map = new Map<string, { data?: ExplorerTreeItem[]; isLoading: boolean }>();
    expandedItems.forEach((item, index) => {
      const result = childrenResults[index];
      if (result) map.set(item.id, { data: result.data, isLoading: result.isPending });
    });
    return map;
  }, [expandedItems, childrenResults]);

  // useQueries returns a new array on every render, so this only re-runs the log when the actual
  // set of errored children queries changes, rather than on every unrelated re-render.
  const childrenErrorsKey = childrenResults
    .map((result, index) => (result.isError ? `${expandedItems[index]?.id}:${result.error}` : ""))
    .join("|");
  useEffect(() => {
    childrenResults.forEach((result) => {
      if (result.isError) {
        if (result.error instanceof ServiceError) writeServiceErrorToLog(result.error, console.error);
        else console.error(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenErrorsKey]);

  const treeItems = useMemo(
    () => mergeChildrenIntoTree(rootTreeItems, childrenByItemId),
    [rootTreeItems, childrenByItemId]
  );

  const handleExpandItem = (item: ExplorerTreeItem) => {
    if (!modelId) return;
    setExpandedItems((prev) => (prev.some((expanded) => expanded.id === item.id) ? prev : [...prev, item]));
  };

  const selectedItemId = (initialTab === "occupations" ? occupationId : skillId) ?? treeItems[0]?.id;

  const selectedTreeItem = selectedItemId ? findItemById(treeItems, selectedItemId) : null;

  useEffect(() => {
    setHistoryTabOpenedForItemId(null);
  }, [selectedItemId]);

  const {
    data: detail,
    isPending: isDetailPending,
    isError: isDetailError,
    error: detailError,
  } = useExplorerItemDetail(modelId, selectedTreeItem ?? null);
  const isDetailLoading = !!selectedTreeItem && isDetailPending;

  useEffect(() => {
    if (isDetailError) {
      if (detailError instanceof ServiceError) writeServiceErrorToLog(detailError, console.error);
      else console.error(detailError);
    }
  }, [isDetailError, detailError]);

  // Only spread detail when it belongs to the currently selected item to avoid
  // showing stale data from a previous selection before the new fetch completes.
  const matchingDetail = detail?.id === selectedTreeItem?.id ? detail : null;
  const detailItem: ExplorerDetailItem | null = selectedTreeItem
    ? {
        ...matchingDetail,
        id: selectedTreeItem.id,
        code: selectedTreeItem.code,
        title: selectedTreeItem.title,
        objectType: selectedTreeItem.objectType as ObjectType,
      }
    : null;

  const isHistoryTabOpened = !!selectedItemId && historyTabOpenedForItemId === selectedItemId;
  const {
    data: history,
    isPending: isHistoryPending,
    isError: isHistoryError,
    error: historyError,
  } = useExplorerItemHistory(modelId, selectedTreeItem ?? null, isHistoryTabOpened);
  const isHistoryLoading = isHistoryTabOpened && isHistoryPending;

  useEffect(() => {
    if (isHistoryError) {
      if (historyError instanceof ServiceError) writeServiceErrorToLog(historyError, console.error);
      else console.error(historyError);
    }
  }, [isHistoryError, historyError]);

  const handleHistoryTabOpen = () => {
    if (selectedItemId) setHistoryTabOpenedForItemId(selectedItemId);
  };

  // The CSV button links directly to the model's most recent successful export (if any).
  const csvDownloadUrl = selectedModel ? getLatestSuccessfulExport(selectedModel)?.downloadUrl : undefined;

  const handleModelChange = (newModelId: string) => {
    setSearchValue("");
    setDebouncedSearchValue("");
    navigate(
      generatePath(initialTab === "occupations" ? routerPaths.EXPLORER_OCCUPATIONS : routerPaths.EXPLORER_SKILLS, {
        modelId: newModelId,
      })
    );
  };

  const handleTabChange = (tab: "occupations" | "skills") => {
    if (!modelId) return;
    setSearchValue("");
    setDebouncedSearchValue("");
    navigate(
      generatePath(tab === "occupations" ? routerPaths.EXPLORER_OCCUPATIONS : routerPaths.EXPLORER_SKILLS, { modelId })
    );
  };

  const handleSelectItem = (item: ExplorerTreeItem) => {
    if (!modelId) return;
    if (initialTab === "occupations") {
      navigate(generatePath(routerPaths.EXPLORER_OCCUPATIONS_DETAIL, { modelId, occupationId: item.id }));
    } else {
      navigate(generatePath(routerPaths.EXPLORER_SKILLS_DETAIL, { modelId, skillId: item.id }));
    }
  };

  return (
    <Box data-testid={DATA_TEST_ID.EXPLORER_PAGE} width="100%" height="100%">
      <ContentLayout
        headerComponent={
          <ExplorerHeader
            models={models}
            selectedModel={selectedModel}
            isLoading={isLoadingModels}
            onModelChange={handleModelChange}
            onBackToDirectory={() => navigate(routerPaths.MODEL_DIRECTORY)}
            onOpenApiDocs={() => navigate(routerPaths.API_DOCS)}
            csvDownloadUrl={csvDownloadUrl}
          />
        }
        mainComponent={
          <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(280px, 420px) minmax(0, 1fr)",
                  xl: "minmax(360px, 500px) minmax(0, 1fr)",
                },
                gridTemplateRows: { xs: "minmax(0, 1.2fr) minmax(0, 0.8fr)", md: "minmax(0, 1fr)" },
                gap: theme.fixedSpacing(theme.tabiyaSpacing.md),
              }}
            >
              <Box
                bgcolor="common.white"
                borderRadius={theme.tabiyaRounding.sm}
                border={1}
                borderColor="grey.200"
                sx={{ minHeight: 0, overflow: "auto" }}
              >
                <ExplorerTreePanel
                  activeTab={initialTab}
                  onTabChange={handleTabChange}
                  items={treeItems}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                  onExpandItem={handleExpandItem}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  isLoading={isTreeLoading}
                />
              </Box>
              <Box
                bgcolor="common.white"
                borderRadius={theme.tabiyaRounding.sm}
                border={1}
                borderColor="grey.200"
                sx={{ minHeight: 0, overflow: "auto" }}
              >
                <ExplorerDetailPanel
                  item={detailItem}
                  isLoading={isDetailLoading || (isTreeLoading && !selectedTreeItem)}
                  history={history ?? null}
                  isHistoryLoading={isHistoryLoading}
                  onHistoryTabOpen={handleHistoryTabOpen}
                />
              </Box>
            </Box>
          </Box>
        }
      />
    </Box>
  );
};

export default ExplorerPage;
