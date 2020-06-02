// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';
import uniqWith from 'lodash/uniqWith';

import { IJSONChangeAdd, IJSONChangeDelete, IJSONChangeUpdate } from '../jsonDiff/types';
import { getWithJsonPath, jsonPathParrent, JsonPathStart } from '../jsonDiff/helper';

import { DialogObject } from './types';
import { isDialogItem } from './comparators';

// if current path value is not a dialog object, look upwards util find one.
function upwardsFindDialogObject(json, path): { path: string; value: DialogObject } {
  if (path === JsonPathStart) return { path, value: json };
  const value = getWithJsonPath(json, path);
  if (isDialogItem(value)) {
    return { path, value };
  } else {
    return upwardsFindDialogObject(json, jsonPathParrent(path));
  }
}

// same as mergeChanges but handle updates
export function mergeUpdateChanges(prevJson, currJson, changes: IJSONChangeUpdate[]): IJSONChangeUpdate[] {
  if (!changes.length) return changes;
  const mergedChanges = changes.map(item => {
    if (isDialogItem(item.value)) {
      return item;
    } else {
      const { path, value } = upwardsFindDialogObject(currJson, item.path);
      const preValue = getWithJsonPath(prevJson, path);
      return { path, value, preValue };
    }
  });
  return uniqWith(mergedChanges, isEqual);
}

/**
 * if current path's change is not a dialog item, look upwards util a change is on a dialog item.
 * e.g  [{ path: '$.a.name', ...},{ path: '$.a.age', ... } ]
 * --- merge change ---  =>
 * [{ path: '$.a', {name, age, ...} ]
 */
export function mergeChanges(
  json,
  changes: IJSONChangeAdd[] | IJSONChangeDelete[]
): IJSONChangeAdd[] | IJSONChangeDelete[] {
  if (!changes.length) return changes;
  const mergedChanges = changes.map(item => {
    if (isDialogItem(item.value)) {
      return item;
    } else {
      return upwardsFindDialogObject(json, item.path);
    }
  });
  return uniqWith(mergedChanges, isEqual);
}
