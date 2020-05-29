// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
import { DialogDiff } from '@bfc/shared';

import { IResourceChanges } from './types';
import { VirtualDialogResource } from './virtualDialogResource';

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
    const lg = differenceWith(currLg, prevLg, isEqual);
    const lu = differenceWith(currLu, prevLu, isEqual);
    changes.lg.updates.push(...lg);
    changes.lu.updates.push(...lu);
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
