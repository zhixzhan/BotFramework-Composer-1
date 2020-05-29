// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import isEqual from 'lodash/isEqual';
import { DialogConverterReverse, DialogResourceChanges } from '@bfc/indexers/lib/dialogUtils/virtualDialog';
import { LgFile, LuFile, SDKKinds } from '@bfc/shared';
import { dialogIndexer } from '@bfc/indexers';

import { ActionCreator, State } from '../types';
import { undoable } from '../middlewares/undo';
import * as lgUtil from '../../utils/lgUtil';
import * as luUtil from '../../utils/luUtil';
import LgWorker from '../parsers/lgWorker';
import LuWorker from '../parsers/luWorker';
import { updateRegExIntent, recognizerType } from '../../utils/dialogUtil';

import { ActionTypes } from './../../constants/index';
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
  store.dispatch({
    type: ActionTypes.UPDATE_DIALOG,
    payload: { id, content },
  });
};

export const updateVirtualDialog: ActionCreator = async (store, { id, content, prevContent }) => {
  const state = store.getState();
  const { lgFiles, luFiles, dialogs, locale, schemas } = state;

  const dialogFile = dialogs.find(f => f.id === id);
  const dialogLgFile = lgFiles.find(f => f.id === `${id}.${locale}`);
  const dialogLuFile = luFiles.find(f => f.id === `${id}.${locale}`);
  const changes = DialogResourceChanges(prevContent, content);

  console.log('Reducer changes: ', changes);

  let newLgFile;
  let newLuFile;
  let newDialog;

  if (dialogLgFile) {
    let newContent = lgUtil.removeTemplates(dialogLgFile.content, changes.lg.deletes);
    newContent = lgUtil.addTemplates(newContent, changes.lg.adds);
    newContent = lgUtil.updateTemplates(newContent, changes.lg.updates);
    if (newContent !== dialogLgFile.content) {
      const { templates, diagnostics } = (await LgWorker.parse(dialogLgFile.id, newContent, lgFiles)) as LgFile;
      newLgFile = { id: dialogLgFile.id, content: newContent, templates, diagnostics };
    }
  }

  const luType = recognizerType(dialogFile?.content);
  if (luType === SDKKinds.LuisRecognizer && dialogLuFile) {
    let newContent = luUtil.removeIntents(dialogLuFile.content, changes.lu.deletes);
    newContent = luUtil.addIntents(newContent, changes.lu.adds);
    newContent = luUtil.updateIntents(newContent, changes.lu.updates);
    if (newContent !== dialogLuFile.content) {
      const { intents, diagnostics } = (await LuWorker.parse(dialogLuFile.id, newContent)) as LuFile;
      newLuFile = { id: dialogLuFile.id, content: newContent, intents, diagnostics };
    }
  } else if (luType === SDKKinds.RegexRecognizer && dialogFile) {
    newDialog = { ...dialogFile };
    for (const intent of changes.lu.updates) {
      const { Name, Body: pattern } = intent;
      newDialog = updateRegExIntent(newDialog, Name, pattern);
    }
  }

  const newDialogContent = DialogConverterReverse(newDialog?.content || content);
  if (dialogFile && !isEqual(newDialogContent, dialogFile.content)) {
    newDialog = { ...dialogFile, ...dialogIndexer.parse(dialogFile.id, newDialogContent, schemas.sdk.content) };
  }

  store.dispatch({
    type: ActionTypes.UPDATE_VIRTUAL_DIALOG,
    payload: {
      dialog: newDialog,
      lgFile: newLgFile,
      luFile: newLuFile,
    },
  });
};

export const updateDialog: ActionCreator = undoable(
  updateDialogBase,
  (state: State, args: any[], isEmpty) => {
    if (isEmpty) {
      const id = state.designPageLocation.dialogId;
      const dialog = state.dialogs.find(dialog => dialog.id === id);
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

export const createDialogCancel: ActionCreator = store => {
  const onCreateDialogComplete = store.getState().onCreateDialogComplete;
  if (typeof onCreateDialogComplete === 'function') {
    onCreateDialogComplete(null);
  }
  store.dispatch({
    type: ActionTypes.CREATE_DIALOG_CANCEL,
  });
};
