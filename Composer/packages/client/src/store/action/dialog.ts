// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import cloneDeep from 'lodash/cloneDeep';
import { DialogConverterReverse, DialogResourceChanges } from '@bfc/indexers/lib/dialogUtils/virtualDialog';
import { LgFile, LuFile } from '@bfc/shared';

import { ActionCreator, State } from '../types';
import { undoable } from '../middlewares/undo';
import * as lgUtil from '../../utils/lgUtil';
import * as luUtil from '../../utils/luUtil';
import LgWorker from '../parsers/lgWorker';
import LuWorker from '../parsers/luWorker';

import { ActionTypes } from './../../constants/index';
import { Store } from './../types';

const reindexLgFiles = async (id, content, files): Promise<LgFile[]> => {
  const newFiles = cloneDeep(files).map(f => {
    if (f.id === id) {
      f.content = content;
      return f;
    }
    return f;
  });

  const newIndexeFiles: LgFile[] = [];
  for (const file of newFiles) {
    const { templates, diagnostics } = (await LgWorker.parse(id, content, newFiles)) as LgFile;
    newIndexeFiles.push({ ...file, templates, diagnostics });
  }

  return newIndexeFiles;
};

const reindexLuFiles = async (id, content, files): Promise<LuFile[]> => {
  const newFiles = cloneDeep(files).map(f => {
    if (f.id === id) {
      f.content = content;
      return f;
    }
    return f;
  });

  const newIndexeFiles: LuFile[] = [];
  for (const file of newFiles) {
    const { intents, diagnostics } = (await LuWorker.parse(id, content)) as LuFile;
    newIndexeFiles.push({ ...file, intents, diagnostics });
  }

  return newIndexeFiles;
};

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

/**
 * if _vProps is updated, update same id lg/lu
 * if {} is deleted, delete same id lg/lu
 * if {} is added, add same id lg/lu (depends slot a default value or not)
 */
export const updateVirtualDialog: ActionCreator = async (store, { id, content, prevContent }) => {
  const state = store.getState();
  const { lgFiles, luFiles, locale } = state;

  const dialogLgFile = lgFiles.find(f => f.id === `${id}.${locale}`);
  const dialogLuFile = luFiles.find(f => f.id === `${id}.${locale}`);

  /******** use diff find out current dialog related external resource updates (lg/lu) ************/
  const changes = DialogResourceChanges(prevContent, content);

  console.log('dialog resourse changes: ', changes);

  let newLgFiles: LgFile[] = [];
  let newLuFiles: LuFile[] = [];

  if (dialogLgFile) {
    let newContent = lgUtil.removeTemplates(dialogLgFile.content, changes.lg.deletes);
    newContent = lgUtil.addTemplates(newContent, changes.lg.adds);
    newContent = lgUtil.updateTemplates(newContent, changes.lg.updates);

    if (newContent === dialogLgFile.content) {
      newLgFiles = lgFiles;
    } else {
      newLgFiles = await reindexLgFiles(dialogLgFile.id, newContent, lgFiles);
    }
  }

  if (dialogLuFile) {
    let newContent = luUtil.removeIntents(dialogLuFile.content, changes.lu.deletes);
    newContent = luUtil.addIntents(dialogLuFile.content, changes.lu.adds);
    if (newContent === dialogLuFile.content) {
      newLuFiles = luFiles;
    } else {
      newLuFiles = await reindexLuFiles(dialogLuFile.id, newContent, luFiles);
    }
  }

  const rawDialogContent = DialogConverterReverse(content);

  store.dispatch({
    type: ActionTypes.UPDATE_VIRTUAL_DIALOG,
    payload: { id, content: rawDialogContent, lgFiles: newLgFiles, luFiles: newLuFiles },
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
