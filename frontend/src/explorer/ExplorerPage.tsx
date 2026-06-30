import React, { useEffect, useState } from "react";
import { useParams, useNavigate, generatePath } from "react-router-dom";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getApiUrl } from "src/envService";
import { ServiceError } from "src/error/error";
import { writeServiceErrorToLog } from "src/error/logger";
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

  // TODO: fetch from API using modelId + initialTab
  const treeItems: ExplorerTreeItem[] = [];
  const isTreeLoading = false;

  const selectedItemId = (initialTab === "occupations" ? occupationId : skillId) ?? treeItems[0]?.id;

  // TODO: fetch from API using modelId + selectedItemId
  const selectedTreeItem = selectedItemId ? findItemById(treeItems, selectedItemId) : null;
  const detailItem: ExplorerDetailItem | null = selectedTreeItem
    ? { id: selectedTreeItem.id, code: selectedTreeItem.code, title: selectedTreeItem.title }
    : null;
  const isDetailLoading = false;

  const handleModelChange = (newModelId: string) => {
    navigate(generatePath(routerPaths.EXPLORER_OCCUPATIONS, { modelId: newModelId }));
  };

  const handleTabChange = (tab: "occupations" | "skills") => {
    if (!modelId) return;
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
          />
        }
        mainComponent={
          <Box display="flex" flexDirection="row" height="100%" width="100%" overflow="hidden" gap={2}>
            <Box
              flexShrink={0}
              width="35%"
              height="100%"
              overflow="auto"
              bgcolor="common.white"
              borderRadius={theme.tabiyaRounding.sm}
              border={1}
              borderColor="grey.200"
            >
              <ExplorerTreePanel
                activeTab={initialTab}
                onTabChange={handleTabChange}
                items={treeItems}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                isLoading={isTreeLoading}
              />
            </Box>
            <Box
              flex={1}
              height="100%"
              overflow="auto"
              bgcolor="common.white"
              borderRadius={theme.tabiyaRounding.sm}
              border={1}
              borderColor="grey.200"
            >
              <ExplorerDetailPanel item={detailItem} isLoading={isDetailLoading} />
            </Box>
          </Box>
        }
      />
    </Box>
  );
};

export default ExplorerPage;
