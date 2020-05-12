// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import cloneDeep from 'lodash/cloneDeep';
import { useContext, useEffect, useState } from 'react';
import { DialogConverter } from '@bfc/indexers/lib/dialogUtils/dialogConverter';

import { State } from '../store/types';
import { StoreContext } from '../store';

const createVirtualDialogs = (state: State, lgFileResolver, luFileResolver) => {
  const newDialogs = state.dialogs.map(d => {
    const dialog = cloneDeep(d);
    dialog.content = DialogConverter(dialog.content, lgFileResolver, luFileResolver);
    return dialog;
  });
  return newDialogs;
};

export function useVirtualDialog() {
  const { state, resolvers } = useContext(StoreContext);
  const { projectId } = state;
  const { lgFileResolver, luFileResolver } = resolvers;
  const initialVDialogs = createVirtualDialogs(state, lgFileResolver, luFileResolver);
  const [virtualDialogs, setVirtualDialogs] = useState(initialVDialogs);

  useEffect(() => {
    const newVDialog = createVirtualDialogs(state, lgFileResolver, luFileResolver);

    setVirtualDialogs(newVDialog);
  }, [projectId, state.dialogs, state.lgFiles, state.luFiles]);

  const dialogsMap = virtualDialogs.reduce((result, dialog) => {
    result[dialog.id] = dialog.content;
    return result;
  }, {});

  return dialogsMap;
}
