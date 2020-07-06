// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BaseSchema, deepCopyActions, walkAdaptiveActionList } from '@bfc/shared';

export const useActionApi = () => {
  const luFieldName = '_lu';

  function actionsContainLuIntent(actions: BaseSchema[]): boolean {
    let containLuIntents = false;
    walkAdaptiveActionList(actions, (action) => {
      if (action[luFieldName]) {
        containLuIntents = true;
      }
    });
    return containLuIntents;
  }

  async function constructActions(dialogId: string, actions: BaseSchema[]) {
    return deepCopyActions(actions);
  }

  async function copyActions(dialogId: string, actions: BaseSchema[]) {
    return deepCopyActions(actions);
  }

  async function constructAction(dialogId: string, action: BaseSchema) {
    return await constructActions(dialogId, [action]);
  }

  async function copyAction(dialogId: string, action: BaseSchema) {
    return await copyActions(dialogId, [action]);
  }
  return {
    constructAction,
    constructActions,
    copyAction,
    copyActions,
    actionsContainLuIntent,
  };
};
