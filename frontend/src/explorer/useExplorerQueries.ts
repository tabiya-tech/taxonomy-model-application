import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import LanguageAPISpecs from "api-specifications/language";
import ExplorerService from "src/explorer/explorer.service";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import { getApiUrl } from "src/envService";

const explorerService = new ExplorerService(getApiUrl());

export const explorerTreeQueryKey = (
  modelId: string | undefined,
  tab: "occupations" | "skills",
  search: string,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => ["explorer", "tree", modelId, tab, search, language];

export const explorerChildrenQueryKey = (
  modelId: string | undefined,
  itemId: string,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => ["explorer", "children", modelId, itemId, language];

export const explorerDetailQueryKey = (
  modelId: string | undefined,
  itemId: string,
  objectType: string,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => ["explorer", "detail", modelId, itemId, objectType, language];

export const explorerHistoryQueryKey = (
  modelId: string | undefined,
  itemId: string,
  objectType: string,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => ["explorer", "history", modelId, itemId, objectType, language];

// The language is the last part of every explorer query key. When it is the only part that changed, the previous
// data stays on screen until the data in the new language arrives: the ids are the same in every language, so the
// tree, the selected item and its open tab stay in place instead of blanking. Any other change (model, tab, search,
// item) shows the loading state, as the previous data would be about something else.
const keepPreviousDataOnLanguageChange =
  (queryKey: QueryKey) =>
  <T>(previousData: T | undefined, previousQuery: { queryKey: QueryKey } | undefined): T | undefined => {
    if (!previousQuery) return undefined;
    const previousQueryKey = previousQuery.queryKey;
    const isSameQueryInAnotherLanguage =
      previousQueryKey.length === queryKey.length &&
      queryKey.slice(0, -1).every((part, index) => part === previousQueryKey[index]);
    return isSameQueryInAnotherLanguage ? previousData : undefined;
  };

// Search results are always leaves, sorted by relevance; root items are grouped so local
// groups (unseen economy) come after ESCO/ISCO groups (seen economy).
const localGroupsLast = (items: ExplorerTreeItem[]) => [
  ...items.filter((item) => item.objectType !== "localgroup"),
  ...items.filter((item) => item.objectType === "localgroup"),
];

export const useExplorerTree = (
  modelId: string | undefined,
  tab: "occupations" | "skills",
  searchValue: string,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => {
  const trimmedSearchValue = searchValue.trim();
  const queryKey = explorerTreeQueryKey(modelId, tab, trimmedSearchValue, language);
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!modelId) return [];
      if (trimmedSearchValue) {
        return tab === "occupations"
          ? explorerService.searchOccupations(modelId, trimmedSearchValue, language)
          : explorerService.searchSkills(modelId, trimmedSearchValue, language);
      }
      const items = await explorerService.getRootItems(modelId, tab, language);
      return localGroupsLast(items);
    },
    enabled: !!modelId,
    placeholderData: keepPreviousDataOnLanguageChange(queryKey),
  });
};

// One query per expanded node id, so previously expanded groups reuse their cached children
// instead of refetching when collapsed and re-expanded.
export const useExplorerChildren = (
  modelId: string | undefined,
  expandedItems: ExplorerTreeItem[],
  language: LanguageAPISpecs.Types.LanguageShortCode
) => {
  return useQueries({
    queries: expandedItems.map((item) => {
      const queryKey = explorerChildrenQueryKey(modelId, item.id, language);
      return {
        queryKey,
        queryFn: () => explorerService.getChildren(modelId as string, item, language),
        enabled: !!modelId,
        placeholderData: keepPreviousDataOnLanguageChange(queryKey),
      };
    }),
  });
};

export const useExplorerItemDetail = (
  modelId: string | undefined,
  item: ExplorerTreeItem | null,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => {
  const queryKey = explorerDetailQueryKey(modelId, item?.id ?? "", item?.objectType ?? "", language);
  return useQuery({
    queryKey,
    queryFn: () => explorerService.getItemDetail(modelId as string, item as ExplorerTreeItem, language),
    enabled: !!modelId && !!item,
    placeholderData: keepPreviousDataOnLanguageChange(queryKey),
  });
};

export const useExplorerItemHistory = (
  modelId: string | undefined,
  item: ExplorerTreeItem | null,
  enabled: boolean,
  language: LanguageAPISpecs.Types.LanguageShortCode
) => {
  const queryKey = explorerHistoryQueryKey(modelId, item?.id ?? "", item?.objectType ?? "", language);
  return useQuery({
    queryKey,
    queryFn: () => explorerService.getItemHistory(modelId as string, item as ExplorerTreeItem, language),
    enabled: !!modelId && !!item && enabled,
    placeholderData: keepPreviousDataOnLanguageChange(queryKey),
  });
};
