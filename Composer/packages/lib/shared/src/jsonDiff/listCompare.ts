// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import isEqual from 'lodash/isEqual';
import intersectionBy from 'lodash/intersectionBy';
import differenceWith from 'lodash/differenceWith';
import indexOf from 'lodash/indexOf';

import { IValueComparator, IListCompareChanges } from './types';

export function ListCompare(list1: any[], list2: any[], comparator?: IValueComparator): IListCompareChanges {
  const usedComparator = comparator || isEqual;
  // difference comparator is an updated comparator
  const list1Changes = differenceWith(list1, list2, usedComparator).map((item) => {
    return {
      index: indexOf(list1, item),
      value: item,
    };
  }); // list1[index] item are not found in list2
  const list2Changes = differenceWith(list2, list1, usedComparator).map((item) => {
    return {
      index: indexOf(list2, item),
      value: item,
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
