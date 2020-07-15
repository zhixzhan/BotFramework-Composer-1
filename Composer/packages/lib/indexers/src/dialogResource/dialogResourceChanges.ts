// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DialogDiff, ListCompare } from '@bfc/shared';

import { IResourceChanges, ILUResourceChanges, ILGResourceChanges } from './types';
import { DialogResource } from './dialogResource';
import { copyAdaptiveNodes } from './copyAdaptiveNodes';

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

export function DialogResourceChanges(dialog1, dialog2, { lgFiles, luFiles }): IResourceChanges {
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
    dialog: {
      adds: [],
      deletes: [],
      updates: [],
    },
  } as IResourceChanges;
  // find all in dialog1, treat as `adds`
  if (!dialog2) {
    const { lg, lu } = DialogResource(dialog1, { lgFiles, luFiles });
    changes.lg.adds === lg;
    changes.lu.adds === lu;
    return changes;
  }

  const { adds, deletes, updates } = DialogDiff(dialog1, dialog2);
  changes.dialog.deletes.push(...deletes);
  changes.dialog.updates.push(...updates);
  for (const item of updates) {
    const { path } = item;
    const { lg: prevLg, lu: prevLu } = DialogResource(dialog1, { lgFiles, luFiles, path });
    const { lg: currLg, lu: currLu } = DialogResource(dialog2, { lgFiles, luFiles, path });
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
    const { path } = item;

    const { lg, lu } = DialogResource(dialog1, { lgFiles, luFiles, path });
    changes.lg.deletes.push(...lg.map(({ name }) => name));
    changes.lu.deletes.push(...lu.map(({ Name }) => Name));
  }

  for (const item of adds) {
    const { path } = item;

    const copiedResource = copyAdaptiveNodes(dialog2, { lgFiles, luFiles, path });
    changes.dialog.adds.push({ path, value: copiedResource.newNodes });
    changes.lg.adds.push(...copiedResource.lg);
    changes.lu.adds.push(...copiedResource.lu);
  }

  return changes;
}
