// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';
import uniqWith from 'lodash/uniqWith';

import { IJSONChangeAdd, IJSONChangeDelete, IJSONChangeUpdate, IJsonChanges } from '../jsonDiff/types';
import { getWithJsonPath, jsonPathParrent, JsonPathStart, hasWithJsonPath } from '../jsonDiff/helper';

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

/**
 * if current path's change is not a dialog item, look upwards util a change is on a dialog item.
 * e.g  [{ path: '$.a.name', ...},{ path: '$.a.age', ... } ]
 * --- merge change ---  =>
 * [{ path: '$.a', {name, age, ...} ]
 */
export function convertJsonChanges(prevJson, currJson, changes: IJsonChanges): IJsonChanges {
  const adds: IJSONChangeAdd[] = [];
  const deletes: IJSONChangeDelete[] = [];
  const updates: IJSONChangeUpdate[] = [];

  changes.adds.forEach((item) => {
    if (isDialogItem(item.value)) {
      adds.push(item);
    } else {
      const upItem = upwardsFindDialogObject(currJson, item.path);
      if (hasWithJsonPath(prevJson, upItem.path)) {
        updates.push({
          ...upItem,
          preValue: getWithJsonPath(prevJson, upItem.path),
        });
      } else {
        adds.push(upItem);
      }
    }
  });

  changes.deletes.forEach((item) => {
    if (isDialogItem(item.value)) {
      deletes.push(item);
    } else {
      const upItem = upwardsFindDialogObject(currJson, item.path);
      if (hasWithJsonPath(prevJson, upItem.path)) {
        updates.push({
          ...upItem,
          preValue: getWithJsonPath(prevJson, upItem.path),
        });
      } else {
        deletes.push(upItem);
      }
    }
  });

  changes.updates.forEach((item) => {
    if (isDialogItem(item.value)) {
      updates.push(item);
    } else {
      const upItem = upwardsFindDialogObject(currJson, item.path);
      const preValue = getWithJsonPath(prevJson, upItem.path);
      updates.push({
        ...upItem,
        preValue,
      });
    }
  });

  const uniqAdds = uniqWith(adds, isEqual);
  const uniqDeletes = uniqWith(deletes, isEqual);
  const uniqUpdates = uniqWith(updates, isEqual);

  return {
    adds: uniqAdds,
    deletes: uniqDeletes,
    updates: uniqUpdates,
  };
}
