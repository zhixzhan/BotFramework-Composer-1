// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import { JSONPath } from 'jsonpath-plus';

export const JsonPathStart = '$';

export function JsonPathToObjectPath(path) {
  return path.startsWith(JsonPathStart) ? path.replace(/^\$\.?/, '') : path;
}

export function getWithJsonPath(json, path) {
  if (path === JsonPathStart) return json;
  const result = JSONPath({ path, json });
  return result.length === 0 ? undefined : result[0];
}

export function hasWithJsonPath(json, path) {
  if (path === JsonPathStart) return true;
  const result = JSONPath({ path, json });
  return result.length !== 0;
}

export function jsonPathParrent(path: string): string {
  if (path === JsonPathStart) return path;
  const splitChar = path.endsWith(']') ? '[' : '.';
  const splitIdx = path.lastIndexOf(splitChar);
  return path.slice(0, splitIdx);
}

export function JsonSet(origin: any, updates: { path: string; value: any }[]) {
  return updates.reduce((result, currentItem) => {
    const { path, value } = currentItem;
    const lodashPath = JsonPathToObjectPath(path);
    return set(result, lodashPath, value);
  }, cloneDeep(origin));
}

export function JsonInsert(origin: any, updates: { path: string; value: any }[]) {
  return updates.reduce((origin, currentItem) => {
    const { path, value } = currentItem;
    const lodashPath = JsonPathToObjectPath(path);
    const matched = lodashPath.match(/(.*)\[(\d+)\]$/);
    if (!matched) throw new Error('insert path must in an array, e.g [1]');
    const [, insertListPath, insertIndex] = matched;
    const insertListValue = insertListPath ? get(origin, insertListPath) : origin;
    if (!Array.isArray(insertListValue)) throw new Error('insert target path value is not an array');

    insertListValue.splice(Number(insertIndex), 0, value);
    return insertListPath ? set(origin, insertListPath, insertListValue) : insertListValue;
  }, cloneDeep(origin));
}
