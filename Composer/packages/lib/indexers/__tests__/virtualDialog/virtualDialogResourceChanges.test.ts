/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import { JsonSet, JsonInsert } from '@bfc/shared';

import { VirtualLGPropName, VirtualLUPropName } from '../../src/virtualDialog/constants';
import { VirtualDialogConverter, VirtualDialogResourceChanges } from '../../src/virtualDialog';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const dialogFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../_data_/todobotwithluissample.test.dialog'), 'utf-8')
);

const lgFile = lgIndexer.parse(
  fs.readFileSync(path.join(__dirname, '../_data_/language-generation/en-us/todobotwithluissample.en-us.lg'), 'utf-8')
);
const luFile = luIndexer.parse(
  fs.readFileSync(
    path.join(__dirname, '../_data_/language-understanding/en-us/todobotwithluissample.en-us.lu'),
    'utf-8'
  )
);

const lgFileResolver = () => {
  return lgFile;
};

const luFileResolver = () => {
  return luFile;
};

describe('Edit/Copy/Move on virtual dialog', () => {
  it('Edit SendActivity virtual property, contains LG', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      { path: `triggers[0].actions[0].actions[0].actions[0].${VirtualLGPropName}.activity`, value: '- updated!' },
    ];

    const vdialog2 = JsonSet(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(1);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.updates[0].name).toEqual('SendActivity_202664');
    expect(changes.lg.updates[0].body).toEqual('- updated!');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Edit ConfirmInput virtual property, contains LG/LU', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      { path: `triggers[6].actions[0].${VirtualLGPropName}.prompt`, value: '- propmpt updated!' },
      { path: `triggers[6].actions[0].${VirtualLUPropName}.body`, value: '- lu body updated!' },
    ];

    const vdialog2 = JsonSet(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(1);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.updates[0].name).toEqual('ConfirmInput_Prompt_107784');
    expect(changes.lg.updates[0].body).toEqual('- propmpt updated!');
    expect(changes.lu.updates.length).toEqual(1);
    expect(changes.lu.updates[0].Name).toEqual('ConfirmInput_Response_107784');
    expect(changes.lu.updates[0].Body).toEqual('- lu body updated!');
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Copy SendActivity with virtual property', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.SendActivity',
          $designer: {
            id: 'Y39scR',
          },
          activity: '${SendActivity_Y39scR()}',
          [VirtualLGPropName]: {
            activity: "- You said '${turn.activity.text}'",
          },
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(1);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.adds[0].name).toEqual('SendActivity_Y39scR');
    expect(changes.lg.adds[0].body).toEqual("- You said '${turn.activity.text}'");
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Copy intent, contains LG/LU should be added', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      {
        path: 'triggers[7]',
        value: {
          $kind: 'Microsoft.OnIntent',
          $designer: {
            id: '6L3t6X',
          },
          intent: 'hello',
          actions: [
            {
              $kind: 'Microsoft.SendActivity',
              $designer: {
                id: 'kbvD42',
              },
              activity: '${SendActivity_kbvD42()}',
              [VirtualLGPropName]: {
                activity: '- hello',
              },
            },
          ],
          [VirtualLUPropName]: {
            name: 'hello',
            body: '- hello',
          },
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(1);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(1);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Copy TextInput, contains LG/LU should be added', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.TextInput',
          $designer: {
            id: '96TcCU',
          },
          allowInterruptions: false,
          alwaysPrompt: false,
          prompt: '${TextInput_Prompt_96TcCU()}',
          unrecognizedPrompt: '${TextInput_UnrecognizedPrompt_96TcCU()}',
          invalidPrompt: '${TextInput_InvalidPrompt_96TcCU()}',
          defaultValueResponse: '${TextInput_DefaultValueResponse_96TcCU()}',
          disabled: false,
          maxTurnCount: 3,
          [VirtualLGPropName]: {
            defaultValueResponse: '- 6',
            invalidPrompt: '- 5',
            prompt: '- 1',
            unrecognizedPrompt: '- 4',
          },
          [VirtualLUPropName]: {
            name: 'TextInput_Response_96TcCU',
            body: '-23',
          },
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(4);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.adds[0].name).toEqual('TextInput_DefaultValueResponse_96TcCU');
    expect(changes.lg.adds[0].body).toEqual('- 6');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(1);
    expect(changes.lu.adds[0].Name).toEqual('TextInput_Response_96TcCU');
    expect(changes.lu.adds[0].Body).toEqual('-23');
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('Move ConfirmInput, origin contains LG/LU should be deleted', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
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

    const vdialog2 = JsonSet(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
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
