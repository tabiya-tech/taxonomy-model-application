import { useQueries, useQuery } from "@tanstack/react-query";
import ExplorerService from "src/explorer/explorer.service";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import { getApiUrl } from "src/envService";

const explorerService = new ExplorerService(getApiUrl());

export const explorerTreeQueryKey = (modelId: string | undefined, tab: "occupations" | "skills", search: string) => [
  "explorer",
  "tree",
  modelId,
  tab,
  search,
];

export const explorerChildrenQueryKey = (modelId: string | undefined, itemId: string) => [
  "explorer",
  "children",
  modelId,
  itemId,
];

export const explorerDetailQueryKey = (modelId: string | undefined, itemId: string, objectType: string) => [
  "explorer",
  "detail",
  modelId,
  itemId,
  objectType,
];

export const explorerHistoryQueryKey = (modelId: string | undefined, itemId: string, objectType: string) => [
  "explorer",
  "history",
  modelId,
  itemId,
  objectType,
];

// Search results are always leaves, sorted by relevance; root items are grouped so local
// groups (unseen economy) come after ESCO/ISCO groups (seen economy).
const localGroupsLast = (items: ExplorerTreeItem[]) => [
  ...items.filter((item) => item.objectType !== "localgroup"),
  ...items.filter((item) => item.objectType === "localgroup"),
];

export const useExplorerTree = (modelId: string | undefined, tab: "occupations" | "skills", searchValue: string) => {
  const trimmedSearchValue = searchValue.trim();
  return useQuery({
    queryKey: explorerTreeQueryKey(modelId, tab, trimmedSearchValue),
    queryFn: async () => {
      if (!modelId) return [];
      if (trimmedSearchValue) {
        return tab === "occupations"
          ? explorerService.searchOccupations(modelId, trimmedSearchValue)
          : explorerService.searchSkills(modelId, trimmedSearchValue);
      }
      const items = await explorerService.getRootItems(modelId, tab);
      return localGroupsLast(items);
    },
    enabled: !!modelId,
  });
};

// One query per expanded node id, so previously expanded groups reuse their cached children
// instead of refetching when collapsed and re-expanded.
export const useExplorerChildren = (modelId: string | undefined, expandedItems: ExplorerTreeItem[]) => {
  return useQueries({
    queries: expandedItems.map((item) => ({
      queryKey: explorerChildrenQueryKey(modelId, item.id),
      queryFn: () => explorerService.getChildren(modelId as string, item),
      enabled: !!modelId,
    })),
  });
};

export const useExplorerItemDetail = (modelId: string | undefined, item: ExplorerTreeItem | null) => {
  return useQuery({
    queryKey: explorerDetailQueryKey(modelId, item?.id ?? "", item?.objectType ?? ""),
    queryFn: () => explorerService.getItemDetail(modelId as string, item as ExplorerTreeItem),
    enabled: !!modelId && !!item,
  });
};

export const useExplorerItemHistory = (
  modelId: string | undefined,
  item: ExplorerTreeItem | null,
  enabled: boolean
) => {
  return useQuery({
    queryKey: explorerHistoryQueryKey(modelId, item?.id ?? "", item?.objectType ?? ""),
    queryFn: () => explorerService.getItemHistory(modelId as string, item as ExplorerTreeItem),
    enabled: !!modelId && !!item && enabled,
  });
};
