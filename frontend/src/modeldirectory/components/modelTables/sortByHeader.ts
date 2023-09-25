const sortItems = (aValue: any, bValue: any, key: string): number => {
  let comparison = 0;
  if (aValue instanceof Date && bValue instanceof Date) {
    comparison = aValue.getTime() - bValue.getTime();
  } else if (typeof aValue === 'string' && typeof bValue === 'string') {
    if (key === 'version') {
      try {
        const aVersion = aValue.split('.').map(Number);
        const bVersion = bValue.split('.').map(Number);
        for (let i = 0; i < aVersion.length; i++) {
          if (aVersion[i] > bVersion[i]) {
            comparison = 1;
            break;
          } else if (aVersion[i] < bVersion[i]) {
            comparison = -1;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Invalid version format for key ${key}`);
      }
    } else {
      try {
        comparison = aValue.localeCompare(bValue);
      } catch (err: any) {
        console.warn(`Unsupported sort comparison for key ${key}`);
      }
    }
  } else {
    console.warn(`Unsupported sort comparison for key ${key}`);
  }
  return comparison;
};

export default sortItems;
