// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogDiff, ListCompare } from '@bfc/shared';

import { IResourceChanges, ILUResourceChanges, ILGResourceChanges } from './types';
import { VirtualDialogResource } from './virtualDialogResource';

function lgListResourceChanges(list1, list2): ILGResourceChanges {
  const changes = ListCompare(list1, list2);
  const adds = changes.adds.map(({ value }) => value);
  const deletes = changes.deletes.map(({ value }) => value.name);
  const updates = changes.updates.map(({ value }) => value);

  return {
    adds,
    deletes,
    updates,
  };
}

function luListResourceChanges(list1, list2): ILUResourceChanges {
  const changes = ListCompare(list1, list2);
  const adds = changes.adds.map(({ value }) => value);
  const deletes = changes.deletes.map(({ value }) => value.Name);
  const updates = changes.updates.map(({ value }) => value);

  return {
    adds,
    deletes,
    updates,
  };
}

export function VirtualDialogResourceChanges(dialog1, dialog2): IResourceChanges {
  const changes = {
    lg: {
      adds: [],
      deletes: [],
      updates: [],
    },
    lu: {
      adds: [],
      deletes: [],
      updates: [],
    },
  } as IResourceChanges;
  // find all in dialog1, treat as `adds`
  if (!dialog2) {
    const { lg, lu } = VirtualDialogResource(dialog1);
    changes.lg.adds === lg;
    changes.lu.adds === lu;
    return changes;
  }

  const { adds, deletes, updates } = DialogDiff(dialog1, dialog2);
  for (const item of updates) {
    const { lg: prevLg, lu: prevLu } = VirtualDialogResource(item.preValue);
    const { lg: currLg, lu: currLu } = VirtualDialogResource(item.value);
    const lgChanges = lgListResourceChanges(prevLg, currLg);
    const luChanges = luListResourceChanges(prevLu, currLu);

    changes.lg.updates.push(...lgChanges.updates);
    changes.lg.adds.push(...lgChanges.adds);
    changes.lg.deletes.push(...lgChanges.deletes);
    changes.lu.updates.push(...luChanges.updates);
    changes.lu.adds.push(...luChanges.adds);
    changes.lu.deletes.push(...luChanges.deletes);
  }

  for (const item of deletes) {
    const { lg, lu } = VirtualDialogResource(item.value);
    changes.lg.deletes.push(...lg.map(({ name }) => name));
    changes.lu.deletes.push(...lu.map(({ Name }) => Name));
  }

  for (const item of adds) {
    const { lg, lu } = VirtualDialogResource(item.value);
    changes.lg.adds.push(...lg);
    changes.lu.adds.push(...lu);
  }

  return changes;
}
