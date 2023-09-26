import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ModelsTableProps} from "./ModelsTable";
import {SortableKeys, SortDirection} from "./withSorting.types";
import sortItems from "./sortByHeader";

export interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}

export interface SortedModelsTableProps extends ModelsTableProps {
  sortingState?: [SortConfig, React.Dispatch<React.SetStateAction<SortConfig>>]
}

const withSorting = <P extends ModelsTableProps>(WrappedComponent: React.ComponentType<P>) => {
  return (props: P & SortedModelsTableProps) => {
    const [sortConfig, setSortConfig] = props.sortingState ?? useState<SortConfig>({ key: 'updatedAt', direction: SortDirection.DESCENDING });
    const sortedModels = useMemo(() => {
      let sortableItems = [...props.models];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {

          let comparison = sortItems(a[sortConfig.key], b[sortConfig.key], sortConfig.key)
          return sortConfig.direction === SortDirection.ASCENDING ? comparison : -comparison;
        });
      }
      return sortableItems;
    }, [props.models, sortConfig]);

    /*
           If the same key is clicked, toggle the direction.
           If a new key is clicked, use the provided direction or the default one based on the key.
           the default for name is SortDirection.ASCENDING
           the defaults for everything else are SortDirection.DESCENDING
      */
    const requestSort = useCallback((key: SortableKeys, direction: SortDirection = key === 'name' ? SortDirection.ASCENDING : SortDirection.DESCENDING ) => {
      if (sortConfig.key === key) {
        // Toggle direction if the same key is clicked.
        direction = sortConfig.direction === SortDirection.ASCENDING ? SortDirection.DESCENDING : SortDirection.ASCENDING;
      }
      setSortConfig({ key, direction });
    }, [sortConfig.key, sortConfig.direction]);

    useEffect(() => {
      requestSort('updatedAt', SortDirection.DESCENDING)
    }, []);

    return <WrappedComponent {...props} models={sortedModels} requestSort={requestSort} />;
  };
};

export default withSorting;
