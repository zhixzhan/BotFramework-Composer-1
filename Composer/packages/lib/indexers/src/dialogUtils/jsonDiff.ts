// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import get from 'lodash/get';
import set from 'lodash/set';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import { JSONPath } from 'jsonpath-plus';

import { JsonWalk, VisitorFunc } from '../utils/jsonWalk';

import { ListDiff } from './listDiff';

export interface IJSONChangeAdd {
  path: string;
  value: any;
}
export interface IJSONChangeDelete {
  path: string;
  value: any;
}
export interface IJSONChangeUpdate {
  path: string;
  value: any;
  preValue: any;
}

// TODO
/**
 * 1. compare adds <=> deletes, findout `move`
 * 2. handle key name contains dot 'MicroSoft.Send'
 */
export interface IJsonChanges {
  adds: IJSONChangeAdd[];
  deletes: IJSONChangeDelete[];
  updates: IJSONChangeUpdate[];
}

export type IComparator = (
  json1: any,
  json2: any,
  path: string
) => { isChange: boolean; isAdd: boolean; isStop: boolean };
export type IStopper = (json1: any, json2: any, path: string) => boolean;

export const JsonPathStart = '$';

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

/**
 *
 * @param json1
 * @param json2
 * @param path
 * compare json2 to json1 json at path should stop walk
 * case 1: they both are object walk-able value, same type, e.g. {}, {a:1} -> false,
 * case 2: they are not same type, e.g. {}, [] -> true
 * case 3: one of them is non-walk-able type, e.g. 1, {} -> true
 * TODO:
 * case 4: both are array, [], [] -> listDiff
 */
export const defualtJSONStopComparison: IStopper = (json1: any, json2: any, path: string) => {
  const value1 = getWithJsonPath(json1, path);
  const value2 = getWithJsonPath(json2, path);
  if (typeof value1 !== 'object' || typeof value2 !== 'object') return true; // case 3
  if (Array.isArray(value1) !== Array.isArray(value2)) return true; // case 2
  return false;
};

// compare json2 to json1 at path is an update.
export const defaultJSONComparator: IComparator = (json1: any, json2: any, path: string) => {
  const value1 = getWithJsonPath(json1, path);
  const value2 = getWithJsonPath(json2, path);
  const hasValue1 = hasWithJsonPath(json1, path);
  const hasValue2 = hasWithJsonPath(json2, path);
  // _isEqual comparison use http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero
  const isChange = hasValue1 && hasValue2 && !isEqual(value1, value2);
  const isAdd = !hasValue1 && hasValue2;
  const isStop = defualtJSONStopComparison(json1, json2, path);
  return { isChange, isAdd, isStop };
};

export function JsonDiffAdds(prevJson, currJson, comparator?: IComparator): IJSONChangeAdd[] {
  const results: IJSONChangeAdd[] = [];

  const usedComparator = comparator || defaultJSONComparator;
  const visitor: VisitorFunc = (path, value) => {
    // if both value are array, pass to ListDiffer
    const value1 = getWithJsonPath(prevJson, path);
    const value2 = getWithJsonPath(currJson, path);
    if (Array.isArray(value1) && Array.isArray(value2)) {
      const listChanges = ListDiff(value1, value2, usedComparator).adds.map(item => {
        item.path = `${path}${item.path}`;
        return item;
      });
      results.push(...listChanges);
      return true;
    } else {
      const { isAdd, isStop } = usedComparator(prevJson, currJson, path);
      if (isAdd && isStop) {
        results.push({ path, value });
      }
      if (isStop) {
        return true;
      }
    }

    return false;
  };

  JsonWalk(JsonPathStart, currJson, visitor);
  return results;
}

export function JsonDiffDeletes(prevJson, currJson, comparator?: IComparator): IJSONChangeDelete[] {
  return JsonDiffAdds(currJson, prevJson, comparator);
}

export function JsonDiffUpdates(prevJson, currJson, comparator?: IComparator): IJSONChangeUpdate[] {
  const results: IJSONChangeUpdate[] = [];
  const usedComparator = comparator || defaultJSONComparator;

  const visitor: VisitorFunc = (path, value) => {
    // if both value are array, pass to ListDiffer
    const value1 = getWithJsonPath(prevJson, path);
    const value2 = getWithJsonPath(currJson, path);
    if (Array.isArray(value1) && Array.isArray(value2)) {
      const listChanges = ListDiff(value1, value2, usedComparator).updates.map(item => {
        item.path = `${path}${item.path}`;
        return item;
      });
      results.push(...listChanges);
      return true;
    } else {
      const { isChange, isStop } = usedComparator(prevJson, currJson, path);
      // only catch stop leaf's change
      if (isChange && isStop) {
        const preValue = getWithJsonPath(prevJson, path);
        results.push({ path, preValue, value });
      }
      if (isStop) {
        return true;
      }
    }

    return false;
  };

  JsonWalk(JsonPathStart, currJson, visitor);
  return results;
}

/**
 * Why both need JsonDiff & ListDiff ?
 *
 * 1. Diff an object with key (path), compararion happens inside this key field.
 * if key `add` or `delete`, absolutely a change happen on this key (path).
 * if key is same, compare this key's right value would know it's an `update` or not.
 *
 * 2. Diff a list with key like [0],[1], comparation may happen cross it's siblings
 * if key '[4]' is added, and list.length + 1, it's a simple `add` change.
 * if key '[4]' is deleted, and list.length - 1, it's a delete happens somewhere, to figure out where, we need compararion cross all list item.
 * if all key is same, which means list.length is same, the fact probably be `update on [1] & add on [5] & delete on [0]` .
 *
 * @param prevJson {[key:string]: any}
 * @param currJson
 * @param comparator
 */
export function JsonDiff(prevJson, currJson, comparator?: IComparator): IJsonChanges {
  return {
    adds: JsonDiffAdds(prevJson, currJson, comparator),
    deletes: JsonDiffDeletes(prevJson, currJson, comparator),
    updates: JsonDiffUpdates(prevJson, currJson, comparator),
  };
}

/**
 * Utils
 */

export function JsonSet(origin: any, updates: { path: string; value: any }[]) {
  return updates.reduce((origin, currentItem) => {
    const { path, value } = currentItem;
    return set(origin, path, value);
  }, cloneDeep(origin));
}

export function JsonInsert(origin: any, updates: { path: string; value: any }[]) {
  return updates.reduce((origin, currentItem) => {
    const { path, value } = currentItem;
    const matched = path.match(/(.*)\[(\d+)\]$/);
    if (!matched) throw new Error('insert path must in an array, e.g [1]');
    const [, insertListPath, insertIndex] = matched;
    const insertListValue = insertListPath ? get(origin, insertListPath) : origin;
    if (!Array.isArray(insertListValue)) throw new Error('insert target path value is not an array');

    insertListValue.splice(Number(insertIndex), 0, value);
    return insertListPath ? set(origin, insertListPath, insertListValue) : insertListValue;
  }, cloneDeep(origin));
}
