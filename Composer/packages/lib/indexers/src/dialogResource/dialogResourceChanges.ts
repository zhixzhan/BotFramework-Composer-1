// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import set from 'lodash/set';
import { DialogDiff, ListCompare } from '@bfc/shared';
import { JsonPathToObjectPath } from '@bfc/shared/lib/jsonDiff/helper';

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

export function DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver }): IResourceChanges {
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
    const { lg, lu } = DialogResource(dialog1, { lgFileResolver, luFileResolver });
    changes.lg.adds === lg;
    changes.lu.adds === lu;
    return changes;
  }

  const { adds, deletes, updates } = DialogDiff(dialog1, dialog2);
  for (const item of updates) {
    const { path } = item;
    const { lg: prevLg, lu: prevLu } = DialogResource(dialog1, { lgFileResolver, luFileResolver, path });
    const { lg: currLg, lu: currLu } = DialogResource(dialog2, { lgFileResolver, luFileResolver, path });
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

    const { lg, lu } = DialogResource(dialog1, { lgFileResolver, luFileResolver, path });
    changes.lg.deletes.push(...lg.map(({ name }) => name));
    changes.lu.deletes.push(...lu.map(({ Name }) => Name));
  }

  for (const item of adds) {
    const { path } = item;

    const copiedResource = copyAdaptiveNodes(dialog2, { lgFileResolver, luFileResolver, path });
    // in-place modify dialog2. or maybe not?
    set(dialog2, JsonPathToObjectPath(path), copiedResource.newNodes);

    const { lg, lu } = DialogResource(dialog2, { lgFileResolver, luFileResolver, path });
    changes.lg.adds.push(...lg, ...copiedResource.lg);
    changes.lu.adds.push(...lu, ...copiedResource.lu);
  }

  return changes;
}
