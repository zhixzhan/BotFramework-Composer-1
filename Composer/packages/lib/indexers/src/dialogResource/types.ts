// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LgTemplate, LuIntentSection, IJSONChangeAdd, IJSONChangeDelete, IJSONChangeUpdate } from '@bfc/shared';

export interface ILGResourceChanges {
  adds: LgTemplate[];
  deletes: string[];
  updates: LgTemplate[];
}

export interface ILUResourceChanges {
  adds: LuIntentSection[];
  deletes: string[];
  updates: LuIntentSection[];
}

export interface IDialogNodesChanges {
  adds: IJSONChangeAdd[];
  deletes: IJSONChangeDelete[];
  updates: IJSONChangeUpdate[];
}

export interface IResourceChanges {
  lg: ILGResourceChanges;
  lu: ILUResourceChanges;
  dialog: IDialogNodesChanges;
}
