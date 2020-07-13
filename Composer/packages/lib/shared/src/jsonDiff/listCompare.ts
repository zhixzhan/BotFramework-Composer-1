// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import isEqual from 'lodash/isEqual';
import intersectionBy from 'lodash/intersectionBy';
import differenceWith from 'lodash/differenceWith';
import indexOf from 'lodash/indexOf';

import { IValueComparator, IListCompareChanges } from './types';

// make list uniq to compare
export function uniqList(list: any[], comparator?: IValueComparator): { index: number; value: any }[] {
  const usedComparator = comparator || isEqual;

  const items: { count: number; value: any }[] = [];
  const uniqItems = list.map((listItem) => {
    const foundItem = items.find(({ value }) => usedComparator(value, listItem));
    if (!foundItem) {
      items.push({
        count: 1,
        value: listItem,
      });
      return {
        index: 1,
        value: listItem,
      };
    } else {
      foundItem.count += 1;
      return {
        index: foundItem.count,
        value: listItem,
      };
    }
  });

  return uniqItems;
}

// compare index && value
function uniqListComparator(comparator: IValueComparator): IValueComparator {
  return (item1, item2) => {
    return item1.index === item2.index && comparator(item1.value, item2.value);
  };
}

export function ListCompare(list1: any[], list2: any[], comparator?: IValueComparator): IListCompareChanges {
  const usedComparator = comparator || isEqual;

  // // dulplicate items are non-compariable, pull them out at first;
  const uniqList1 = uniqList(list1, usedComparator);
  const uniqList2 = uniqList(list2, usedComparator);
  const usedUniqListComparator = uniqListComparator(usedComparator);

  // difference comparator is an updated comparator
  const list1Changes = differenceWith(uniqList1, uniqList2, usedUniqListComparator).map((item) => {
    return {
      index: indexOf(uniqList1, item),
      value: item.value,
    };
  }); // list1[index] item are not found in list2
  const list2Changes = differenceWith(uniqList2, uniqList1, usedUniqListComparator).map((item) => {
    return {
      index: indexOf(uniqList2, item),
      value: item.value,
    };
  }); // list2[index] item are not found in list1

  // same index's change are should be an `update`.
  const updates = intersectionBy(list2Changes, list1Changes, 'index');
  const updateChangesIndex = updates.map(({ index }) => index);
  // pull out changes already included by `updates`
  const deletes = list1Changes.filter(({ index }) => !updateChangesIndex.includes(index));
  const adds = list2Changes.filter(({ index }) => !updateChangesIndex.includes(index));

  return {
    adds,
    deletes,
    updates,
  };
}
