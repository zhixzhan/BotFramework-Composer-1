// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
