// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LgTemplate, LuIntentSection } from '@bfc/shared';

export interface IResourceChanges {
  lg: {
    adds: LgTemplate[];
    deletes: string[];
    updates: LgTemplate[];
  };
  lu: {
    adds: LuIntentSection[];
    deletes: string[];
    updates: LuIntentSection[];
  };
}
