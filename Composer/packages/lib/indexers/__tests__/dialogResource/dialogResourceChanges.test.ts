/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { JsonSet, JsonInsert } from '@bfc/shared';

import { DialogResourceChanges } from '../../src/dialogResource';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const dialogFile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../_bots_/_test_todobotwithluissample/todobotwithluissample.test.dialog'),
    'utf-8'
  )
);

const lgFile = lgIndexer.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../_bots_/_test_todobotwithluissample/language-generation/en-us/todobotwithluissample.en-us.lg'
    ),
    'utf-8'
  )
);
const luFile = luIndexer.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      '../_bots_/_test_todobotwithluissample/language-understanding/en-us/todobotwithluissample.en-us.lu'
    ),
    'utf-8'
  )
);

const lgFileResolver = () => {
  return lgFile;
};

const luFileResolver = () => {
  return luFile;
};

describe('Copy/Move dialog action node', () => {
  it('Copy SendActivity', () => {
    const dialog1 = cloneDeep(dialogFile);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.SendActivity',
          $designer: {
            id: '202664',
          },
          activity: '${SendActivity_202664()}',
        },
      },
    ];

    const dialog2 = JsonInsert(dialog1, insert1);

    const changes = DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver });
    expect(dialog1).toEqual(dialogFile);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(1);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.adds[0].body).toContain('[Activity');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Copy SendActivity with same id', () => {
    const dialog1 = cloneDeep(dialogFile);
    const insert1 = [
      {
        path: 'triggers[7].actions[0]',
        value: {
          $kind: 'Microsoft.SendActivity',
          $designer: {
            id: '037398',
            name: 'Send a response',
          },
          activity: '${SendActivity_037398()}',
        },
      },
    ];

    const dialog2 = JsonInsert(dialog1, insert1);

    const changes = DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver });
    expect(dialog1).toEqual(dialogFile);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(1);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.adds[0].body).toContain('- Sorry, not sure what you mean. Can you rephrase?');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Delete intent, contains LG/LU should be added', () => {
    const dialog1 = dialogFile;

    const insert1 = [
      {
        path: 'triggers[7]',
        value: undefined,
      },
    ];

    const dialog2 = JsonSet(dialog1, insert1);

    const changes = DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver });
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(5);
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(1);
  });

  it('Copy TextInput, contains LG/LU should be added', () => {
    const dialog1 = dialogFile;
    const textPromptNode = get(dialog1, 'triggers[7].actions[1]');

    const insert1 = [
      {
        path: 'triggers[7].actions[0]',
        value: textPromptNode,
      },
    ];

    const dialog2 = JsonInsert(dialog1, insert1);

    const changes = DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver });
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(4);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(1);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Move ConfirmInput, origin contains LG/LU should be deleted', () => {
    const dialog1 = dialogFile;

    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.BeginDialog',
          $designer: {
            id: 'xzbvEJ',
          },
          activityProcessed: true,
          dialog: 'm8',
        },
      },
    ];

    const dialog2 = JsonSet(dialog1, insert1);

    const changes = DialogResourceChanges(dialog1, dialog2, { lgFileResolver, luFileResolver });
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(1);
    expect(changes.lg.deletes[0]).toEqual('ConfirmInput_Prompt_107784');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(1);
    expect(changes.lu.deletes[0]).toEqual('ConfirmInput_Response_107784');
  });
});
