// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import isEqual from 'lodash/isEqual';
import { DialogResourceChanges } from '@bfc/indexers/lib/dialogResource';
import { LgFile, LuFile, SDKKinds, DialogDiff } from '@bfc/shared';
import { dialogIndexer, validateDialog } from '@bfc/indexers';
import differenceBy from 'lodash/differenceBy';

import { ActionCreator, State } from '../types';
import { undoable } from '../middlewares/undo';
import * as lgUtil from '../../utils/lgUtil';
import * as luUtil from '../../utils/luUtil';
import LgWorker from '../parsers/lgWorker';
import LuWorker from '../parsers/luWorker';
import { updateRegExIntent, recognizerType } from '../../utils/dialogUtil';
import { ActionTypes } from '../../constants';

import { Store } from './../types';

export const removeDialog: ActionCreator = (store, id) => {
  store.dispatch({
    type: ActionTypes.REMOVE_DIALOG,
    payload: { id },
  });
};

export const createDialog: ActionCreator = async (store, { id, content }) => {
  const onCreateDialogComplete = store.getState().onCreateDialogComplete;
  if (typeof onCreateDialogComplete === 'function') {
    setTimeout(() => onCreateDialogComplete(id));
  }
  store.dispatch({
    type: ActionTypes.CREATE_DIALOG,
    payload: { id, content },
  });
};

export const updateDialogBase: ActionCreator = async (store, { id, content }) => {
  const state = store.getState();
  const { lgFiles, luFiles, dialogs, locale } = state;

  const lgFileResolver = function (id: string) {
    const fileId = id.includes('.') ? id : `${id}.${locale}`;
    return lgFiles.find(({ id }) => id === fileId);
  };
  const luFileResolver = function (id: string) {
    const fileId = id.includes('.') ? id : `${id}.${locale}`;
    return luFiles.find(({ id }) => id === fileId);
  };

  const dialogFile = dialogs.find((f) => f.id === id);

  if (!dialogFile) {
    throw new Error(`dialog file ${id} not found`);
  }

  const dialogLgFile = lgFiles.find((f) => f.id === `${id}.${locale}`);
  const dialogLuFile = luFiles.find((f) => f.id === `${id}.${locale}`);
  const prevContent = dialogFile.content;
  const changes = DialogResourceChanges(prevContent, content, { lgFileResolver, luFileResolver });

  const dchanges = DialogDiff(prevContent, content);

  console.log('Dialog changes:', dchanges);

  console.log('Resource changes: ', changes);

  let newLgFile;
  let newLuFile;
  let newDialog;

  if (dialogLgFile) {
    let newContent = lgUtil.removeTemplates(dialogLgFile.content, changes.lg.deletes);
    const templateAdds = differenceBy(changes.lg.adds, dialogLgFile.templates, 'name');
    newContent = lgUtil.addTemplates(newContent, templateAdds);
    newContent = lgUtil.updateTemplates(newContent, changes.lg.updates);
    if (newContent !== dialogLgFile.content) {
      const { templates, diagnostics } = (await LgWorker.parse(dialogLgFile.id, newContent, lgFiles)) as LgFile;
      newLgFile = { id: dialogLgFile.id, content: newContent, templates, diagnostics };
    }
  }

  const prevLuType = recognizerType(prevContent);
  const currLuType = recognizerType(content);
  if (prevLuType === currLuType) {
    if (currLuType === SDKKinds.LuisRecognizer && dialogLuFile) {
      let newContent = luUtil.removeIntents(dialogLuFile.content, changes.lu.deletes);
      newContent = luUtil.addIntents(newContent, changes.lu.adds);
      newContent = luUtil.updateIntents(newContent, changes.lu.updates);
      if (newContent !== dialogLuFile.content) {
        const { intents, diagnostics } = (await LuWorker.parse(dialogLuFile.id, newContent)) as LuFile;
        newLuFile = { id: dialogLuFile.id, content: newContent, intents, diagnostics };
      }
    } else if (currLuType === SDKKinds.RegexRecognizer && dialogFile) {
      newDialog = { ...dialogFile };
      for (const intent of changes.lu.updates) {
        const { Name, Body: pattern } = intent;
        newDialog = updateRegExIntent(newDialog, Name, pattern);
      }
    }
  }

  const newDialogContent = newDialog?.content || content;
  if (dialogFile && !isEqual(newDialogContent, dialogFile.content)) {
    newDialog = {
      ...dialogFile,
      ...dialogIndexer.parse(dialogFile.id, content),
    };
    newDialog.diagnostics = validateDialog(newDialog, state.schemas.sdk.content, state.lgFiles, state.luFiles);
  }

  store.dispatch({
    type: ActionTypes.UPDATE_DIALOG,
    payload: {
      dialog: newDialog,
      lgFile: newLgFile,
      luFile: newLuFile,
    },
  });
};

export const updateDialogBase0: ActionCreator = async (store, { id, content }) => {
  store.dispatch({
    type: ActionTypes.UPDATE_DIALOG,
    payload: { id, content },
  });
};

export const updateDialog: ActionCreator = undoable(
  updateDialogBase,
  (state: State, args: any[], isEmpty) => {
    if (isEmpty) {
      const id = state.designPageLocation.dialogId;
      const dialog = state.dialogs.find((dialog) => dialog.id === id);
      return [{ id, content: dialog ? dialog.content : {} }];
    } else {
      return args;
    }
  },
  (store: Store, from, to) => updateDialogBase(store, ...to),
  (store: Store, from, to) => updateDialogBase(store, ...to)
);

export const createDialogBegin: ActionCreator = ({ dispatch }, actions, onComplete) => {
  dispatch({
    type: ActionTypes.CREATE_DIALOG_BEGIN,
    payload: {
      actionsSeed: actions,
      onComplete,
    },
  });
};

export const createDialogCancel: ActionCreator = (store) => {
  const onCreateDialogComplete = store.getState().onCreateDialogComplete;
  if (typeof onCreateDialogComplete === 'function') {
    onCreateDialogComplete(null);
  }
  store.dispatch({
    type: ActionTypes.CREATE_DIALOG_CANCEL,
  });
};
