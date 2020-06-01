// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';
import uniqWith from 'lodash/uniqWith';

import { IJSONChangeAdd, IJSONChangeDelete, IJSONChangeUpdate } from '../jsonDiff/types';
import { getWithJsonPath, jsonPathParrent, JsonPathStart } from '../jsonDiff/helper';

import { DialogObject } from './types';
import { isDialogItem } from './comparators';

function upwardsFindDialogItem(json, path): { path: string; value: DialogObject } {
  if (path === JsonPathStart) return { path, value: json };
  const value = getWithJsonPath(json, path);
  if (isDialogItem(value)) {
    return { path, value };
  } else {
    return upwardsFindDialogItem(json, jsonPathParrent(path));
  }
}

export function mergeUpdateChanges(prevJson, currJson, changes: IJSONChangeUpdate[]): IJSONChangeUpdate[] {
  if (!changes.length) return changes;
  const mergedChanges = changes.map(item => {
    if (isDialogItem(item.value)) {
      return item;
    } else {
      const { path, value } = upwardsFindDialogItem(currJson, item.path);
      const preValue = getWithJsonPath(prevJson, path);
      return { path, value, preValue };
    }
  });
  return uniqWith(mergedChanges, isEqual);
}

export function mergeChanges(
  json,
  changes: IJSONChangeAdd[] | IJSONChangeDelete[]
): IJSONChangeAdd[] | IJSONChangeDelete[] {
  if (!changes.length) return changes;
  const mergedChanges = changes.map(item => {
    if (isDialogItem(item.value)) {
      return item;
    } else {
      return upwardsFindDialogItem(json, item.path);
    }
  });
  return uniqWith(mergedChanges, isEqual);
}
