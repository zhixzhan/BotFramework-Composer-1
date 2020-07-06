// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * not like JsonDiff, DialogDiff compaire stop at { $kind, $id, ... }
 * The atomic unit to add/delete/update is a dialog object {}
 */

import isEqual from 'lodash/isEqual';

import { defualtJSONStopComparison, JsonDiff } from '../jsonDiff';
import {
  IJsonChanges,
  IJSONChangeAdd,
  IJSONChangeDelete,
  IJSONChangeUpdate,
  IComparator,
  IStopper,
} from '../jsonDiff/types';
import { getWithJsonPath, hasWithJsonPath } from '../jsonDiff/helper';

import { isSameDesignerId, isSameKind } from './comparators';
import { convertJsonChanges } from './helper';

/**
 *
 * @param json1
 * @param json2
 * @param path
 * stop function tell JsonWalk what is the leaf, most small comparision unit. for AdaptiveDialog is { $kind, ...no-child }
 * compare json2 to json1 json at path should stop walk
 * case 1: extend default json stop comparision.
 * case 2: not same $kind type
 * case 3: not same $designer.id, if exist
 */
export const defualtDialogStopComparison: IStopper = (json1: any, json2: any, path: string) => {
  const value1 = getWithJsonPath(json1, path);
  const value2 = getWithJsonPath(json2, path);

  return (
    !isSameKind(value1, value2) || !isSameDesignerId(value1, value2) || defualtJSONStopComparison(json1, json2, path)
  );
};

// compare json2 to json1 at path is an update.
export const defaultDialogComparator: IComparator = (json1: any, json2: any, path: string) => {
  const value1 = getWithJsonPath(json1, path);
  const value2 = getWithJsonPath(json2, path);
  const hasValue1 = hasWithJsonPath(json1, path);
  const hasValue2 = hasWithJsonPath(json2, path);
  const isChange = hasValue1 && hasValue2 && !isEqual(value1, value2);
  const isAdd = !hasValue1 && hasValue2;
  const isStop = defualtDialogStopComparison(json1, json2, path);

  return { isChange, isAdd, isStop };
};

/**
 *
 * @param prevJson , previous json value
 * @param currJson , current json value
 * @param comparator , the compare function used to compare tow value, decide it's a 'add' or not, hasNot in prevJson && has in currJson is the most common comparision function.
 */

export function DialogDiff(prevJson, currJson, comparator?: IComparator): IJsonChanges {
  const usedComparator = comparator || defaultDialogComparator;
  const jsonChanges = JsonDiff(prevJson, currJson, usedComparator);
  return convertJsonChanges(prevJson, currJson, jsonChanges);
}

export function DialogDiffAdd(prevJson, currJson, comparator?: IComparator): IJSONChangeAdd[] {
  return DialogDiff(prevJson, currJson, comparator).adds;
}

export function DialogDiffDelete(prevJson, currJson, comparator?: IComparator): IJSONChangeDelete[] {
  return DialogDiff(prevJson, currJson, comparator).deletes;
}

export function DialogDiffUpdate(prevJson, currJson, comparator?: IComparator): IJSONChangeUpdate[] {
  return DialogDiff(prevJson, currJson, comparator).updates;
}
