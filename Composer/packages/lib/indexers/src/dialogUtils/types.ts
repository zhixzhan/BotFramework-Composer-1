// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LgTemplate, LuIntentSection } from '@bfc/shared';

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

export interface IResourceChanges {
  lg: ILGResourceChanges;
  lu: ILUResourceChanges;
}
