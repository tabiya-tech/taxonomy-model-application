import React, {useCallback, useMemo, useState} from 'react';
import {ModelsTableProps} from "./ModelsTable";
import {SortDirection, SortableKeys} from "./withSorting.types";

interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}


const withSorting = (WrappedComponent: React.FC<ModelsTableProps>) => {
  return (props: ModelsTableProps) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: SortDirection.DESCENDING });

    const sortedModels = useMemo(() => {
      let sortableItems = [...props.models];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
          let comparison;

          if (sortConfig.key === 'updatedAt') {
            // Compare dates by converting them to timestamps
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          } else {
            // For strings, use localeCompare for a correct comparison
            comparison = a[sortConfig.key].localeCompare(b[sortConfig.key]);
          }

          // Determine the direction
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
      }
      return sortableItems;
    }, [props.models, sortConfig]);

    const requestSort = useCallback((key: SortableKeys, direction:SortDirection = key === 'name' ? SortDirection.ASCENDING : SortDirection.DESCENDING ) => {
      if (sortConfig.key === key && sortConfig.direction === SortDirection.ASCENDING) {
        direction = SortDirection.DESCENDING;
      }
      setSortConfig({ key, direction });
    }, [sortConfig.key, sortConfig.direction]);

    return <WrappedComponent {...props} models={sortedModels} requestSort={requestSort} />;
  };
};

export default withSorting;
