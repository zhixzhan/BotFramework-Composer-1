// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { JsonDiff, defualtJSONStopComparison } from '../jsonDiff';
import { IJsonChanges, IComparator, IJSONChangeUpdate } from '../jsonDiff/types';

// updates in N level list, may be an add/delete/update in N+1 level
// continue walk in current list.
export function deconstructUpdates(updates: IJSONChangeUpdate[], comparator?: IComparator): IJsonChanges {
  const results: IJsonChanges = {
    adds: [],
    deletes: [],
    updates: [],
  };

  const leafUpdates: IJSONChangeUpdate[] = [];
  for (let index = 0; index < updates.length; index++) {
    const item = updates[index];
    const { preValue, value } = item;
    if (comparator ? comparator(preValue, value, '$').isStop : defualtJSONStopComparison(preValue, value, '$')) {
      // it's an end level change, no need to walk in.
      leafUpdates.push(item);
      continue;
    }

    const changes = JsonDiff(preValue, value, comparator);

    const changesInUpdates = deconstructUpdates(changes.updates, comparator);

    const adds = [...changes.adds, ...changesInUpdates.adds].map(subItem => {
      subItem.path = `${item.path}${subItem.path.replace(/^\$/, '')}`;
      return subItem;
    });
    const deletes = [...changes.deletes, ...changesInUpdates.deletes].map(subItem => {
      subItem.path = `${item.path}${subItem.path.replace(/^\$/, '')}`;
      return subItem;
    });

    const updates2 = changesInUpdates.updates.map(subItem => {
      subItem.path = `${item.path}${subItem.path.replace(/^\$/, '')}`;
      return subItem;
    });

    results.adds.push(...adds);
    results.deletes.push(...deletes);
    leafUpdates.push(...updates2);
  }

  results.updates = leafUpdates;

  return results;
}
