import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, generatePath } from "react-router-dom";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ExplorerService from "src/explorer/explorer.service";
import { ExplorerItemDetail, ObjectType } from "src/explorer/explorer.types";
import { getApiUrl } from "src/envService";
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

const modelInfoService = new ModelInfoService(getApiUrl());
const explorerService = new ExplorerService(getApiUrl());

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

const replaceItemInTree = (
  items: ExplorerTreeItem[],
  id: string,
  updater: (item: ExplorerTreeItem) => ExplorerTreeItem
): ExplorerTreeItem[] =>
  items.map((item) => {
    if (item.id === id) return updater(item);
    if (item.children) return { ...item, children: replaceItemInTree(item.children, id, updater) };
    return item;
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

  const [models, setModels] = useState<ModelInfoTypes.ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  const [treeItems, setTreeItems] = useState<ExplorerTreeItem[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(true);

  const [detail, setDetail] = useState<ExplorerItemDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    modelInfoService
      .getAllModels()
      .then(setModels)
      .catch((e) => {
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
      })
      .finally(() => setIsLoadingModels(false));
  }, []);

  const selectedModel = models.find((m) => m.id === modelId) ?? null;

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearchValue(searchValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const trimmedSearchValue = initialTab === "skills" ? debouncedSearchValue.trim() : "";

  useEffect(() => {
    if (!modelId) {
      setTreeItems([]);
      return;
    }
    let cancelled = false;
    const loadTreeItems = async () => {
      setIsTreeLoading(true);
      setTreeItems([]);
      try {
        const items = trimmedSearchValue
          ? await explorerService.searchSkills(modelId, trimmedSearchValue)
          : await explorerService.getRootItems(modelId, initialTab);
        if (cancelled) return;
        setTreeItems(
          trimmedSearchValue
            ? items
            : [
                ...items.filter((item) => item.objectType !== ObjectType.LocalGroup),
                ...items.filter((item) => item.objectType === ObjectType.LocalGroup),
              ]
        );
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
        setTreeItems([]);
      } finally {
        if (!cancelled) setIsTreeLoading(false);
      }
    };
    void loadTreeItems();
    return () => {
      cancelled = true;
    };
  }, [modelId, initialTab, trimmedSearchValue]);

  const handleExpandItem = (item: ExplorerTreeItem) => {
    if (!modelId) return;
    setTreeItems((prev) => replaceItemInTree(prev, item.id, (i) => ({ ...i, isLoadingChildren: true })));
    explorerService
      .getChildren(modelId, item)
      .then((children) => {
        setTreeItems((prev) => replaceItemInTree(prev, item.id, (i) => ({ ...i, children, isLoadingChildren: false })));
      })
      .catch((e) => {
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
        setTreeItems((prev) => replaceItemInTree(prev, item.id, (i) => ({ ...i, isLoadingChildren: false })));
      });
  };

  const selectedItemId = (initialTab === "occupations" ? occupationId : skillId) ?? treeItems[0]?.id;

  const selectedTreeItem = selectedItemId ? findItemById(treeItems, selectedItemId) : null;
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

  const treeItemsRef = useRef(treeItems);
  treeItemsRef.current = treeItems;

  useEffect(() => {
    const currentItem = selectedItemId ? findItemById(treeItemsRef.current, selectedItemId) : null;
    if (!modelId || !currentItem) {
      setDetail(null);
      return;
    }
    setIsDetailLoading(true);
    explorerService
      .getItemDetail(modelId, currentItem)
      .then(setDetail)
      .catch((e) => {
        if (e instanceof ServiceError) writeServiceErrorToLog(e, console.error);
        else console.error(e);
        setDetail(null);
      })
      .finally(() => setIsDetailLoading(false));
  }, [modelId, selectedItemId, isTreeLoading]);

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
