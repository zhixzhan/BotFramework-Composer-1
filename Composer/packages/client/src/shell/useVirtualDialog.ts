// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import cloneDeep from 'lodash/cloneDeep';
import { useContext, useEffect, useState, useMemo } from 'react';
import { DialogConverter, VirtualSchemaConverter } from '@bfc/indexers/lib/dialogUtils/virtualDialog';

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

  // console.log(dialogsMap);
  return dialogsMap;
}

export function useVirtualSchema() {
  const { state } = useContext(StoreContext);
  const { projectId, schemas } = state;
  const vSchema = useMemo(() => {
    const newSchema = cloneDeep(schemas);
    newSchema.sdk.content = VirtualSchemaConverter(schemas.sdk.content);
    return newSchema;
  }, [projectId, schemas]);

  return vSchema;
}
