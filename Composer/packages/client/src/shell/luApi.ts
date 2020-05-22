// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useContext, useEffect, useState } from 'react';
import { LuFile, LuIntentSection } from '@bfc/shared';
import throttle from 'lodash/throttle';

import { State, BoundActionHandlers } from '../store/types';
import { StoreContext } from '../store';
import luWorker from '../store/parsers/luWorker';

const createThrottledFunc = fn => throttle(fn, 1000, { leading: true, trailing: true });

function createLuApi(state: State, actions: BoundActionHandlers, luFileResolver: (id: string) => LuFile | undefined) {
  const updateLuIntent = async (id: string, intentName: string, intent: LuIntentSection) => {
    const file = luFileResolver(id);
    if (!file) throw new Error(`lu file ${id} not found`);
    if (!intentName) throw new Error(`intentName is missing or empty`);

    const content = await luWorker.updateIntent(file.content, intentName, intent);
    const projectId = state.projectId;
    return await actions.updateLuFile({ id: file.id, projectId, content });
  };

  return {
    updateLuIntent: createThrottledFunc(updateLuIntent),
  };
}

export function useLuApi() {
  const { state, actions, resolvers } = useContext(StoreContext);
  const { projectId, focusPath } = state;
  const { luFileResolver } = resolvers;
  const [api, setApi] = useState(createLuApi(state, actions, luFileResolver));

  useEffect(() => {
    const newApi = createLuApi(state, actions, luFileResolver);
    setApi(newApi);

    return () => {
      Object.keys(newApi).forEach(apiName => {
        if (typeof newApi[apiName].flush === 'function') {
          newApi[apiName].flush();
        }
      });
    };
  }, [projectId, focusPath]);

  return api;
}
