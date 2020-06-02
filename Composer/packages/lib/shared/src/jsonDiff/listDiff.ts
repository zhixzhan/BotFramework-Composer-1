// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';

import { IJsonChanges, IComparator } from '../jsonDiff/types';

import { deconstructUpdates } from './deconstructUpdates';
import { ListCompare } from './listCompare';

/**
 * diff with listItem's change
 * @param list1 any[]
 * @param list2
 *
 * Compare two list with comparator, find out {adds, deletes, updates}
 *
 * 1. Basic value:
 * ['a','b','c'] vs ['a','b','x']
 * ==> update: {[2]: 'c'->'x'}
 * ['a','b','c'] vs ['x','a','b','c']
 * ==> add: {[0]: 'x'}
 *
 * 2. Object value diffrent by :
 * [{ id: 1, name: 'a' }, { id: 2, name: 'b' }]  vs [{ id: 1, name: 'a' }, { id: 11, name: 'aa' }, { id: 2, name: 'b' }]
 * ==> add: {[1]: { id: 11, name: 'aa' }}
 */

/**
 * diff with key
 * Assume list1, list2 both are uniqed list.
 * @param list1 {[key:string]: any}
 * @param list2
 * @param comparator // value comparator
 */
export function ListDiff(list1: any[], list2: any[], comparator?: IComparator): IJsonChanges {
  const usedComparator = (item1, item2): boolean => {
    if (comparator) {
      const { isChange } = comparator(item1, item2, '$');
      return !isChange;
    } else {
      return isEqual(item1, item2);
    }
  };

  const { adds: addChanges, deletes: deleteChanges, updates: updateChanges } = ListCompare(
    list1,
    list2,
    usedComparator
  );

  // format outputs
  const adds = addChanges.map(({ index, value }) => {
    return {
      path: `[${index}]`,
      value,
    };
  });
  const deletes = deleteChanges.map(({ index, value }) => {
    return {
      path: `[${index}]`,
      value,
    };
  });
  const updates = updateChanges.map(({ index, value }) => {
    const preValue = list1[index];
    return {
      path: `[${index}]`,
      value,
      preValue,
    };
  });

  const changesInUpdates = deconstructUpdates(updates, comparator);

  return {
    adds: adds.concat(changesInUpdates.adds),
    deletes: deletes.concat(changesInUpdates.deletes),
    updates: changesInUpdates.updates,
  };
}
