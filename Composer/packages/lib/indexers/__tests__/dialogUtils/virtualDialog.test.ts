/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';

import get from 'lodash/get';

import { JsonSet, JsonInsert } from '../../src/dialogUtils/jsonDiff';
import { DialogConverter, DialogConverterReverse, DialogResourceChanges } from '../../src/dialogUtils/virtualDialog';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const dialogFile = JSON.parse(fs.readFileSync(`${__dirname}/data/todobotwithluissample.dialog`, 'utf-8'));
const lgFile = lgIndexer.parse(
  fs.readFileSync(`${__dirname}/data/language-generation/en-us/todobotwithluissample.en-us.lg`, 'utf-8')
);
const luFile = luIndexer.parse(
  fs.readFileSync(`${__dirname}/data/language-understanding/en-us/todobotwithluissample.en-us.lu`, 'utf-8')
);

const lgFileResolver = () => {
  return lgFile;
};

const luFileResolver = () => {
  return luFile;
};

describe('Virtual Dialog Convert', () => {
  it('should convert dialog -> virtual dialog', () => {
    const convertedDialog = DialogConverter(dialogFile, lgFileResolver, luFileResolver);

    expect(get(convertedDialog, 'triggers[0].actions[0].actions[0].actions[0]._virtual_activity')).toEqual(
      '${SendActivity_202664()}'
    );
    expect(get(convertedDialog, 'triggers[0].actions[0].actions[0].actions[0].activity')).toContain('[Activity');

    expect(get(convertedDialog, 'triggers[6].actions[0]._virtual_prompt')).toEqual('${ConfirmInput_Prompt_107784()}');
    expect(get(convertedDialog, 'triggers[6].actions[0].prompt')).toContain('- Are you sure you want to cancel?');

    expect(get(convertedDialog, 'triggers[1].intent')).toEqual('Add');
    expect(get(convertedDialog, 'triggers[1]._virtual_luis_name')).toEqual('Add');
    expect(get(convertedDialog, 'triggers[1]._virtual_luis_body')).toContain('- Add todo');
  });

  it('should convert virtual dialog -> dialog', () => {
    const convertedDialog = DialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const reverseConvertedDialog = DialogConverterReverse(convertedDialog);
    expect(reverseConvertedDialog).toEqual(dialogFile);
  });
});

describe('Virtual Dialog Resources', () => {
  it('update by virtual property', () => {
    const vdialog1 = DialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      { path: 'triggers[0].actions[0].actions[0].actions[0].activity', value: '- updated!' },
      { path: 'triggers[6].actions[0].prompt', value: '- propmpt updated!' },
    ];

    const vdialog2 = JsonSet(vdialog1, insert1);

    const changes = DialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(2);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.updates[0].name).toEqual('SendActivity_202664');
    expect(changes.lg.updates[0].body).toEqual('- updated!');
    expect(changes.lg.updates[1].name).toEqual('ConfirmInput_Prompt_107784');
    expect(changes.lg.updates[1].body).toEqual('- propmpt updated!');
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('add by virtual property', () => {
    const vdialog1 = DialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.SendActivity',
          $designer: {
            id: 'Y39scR',
          },
          _virtual_activity: '${SendActivity_Y39scR()}',
          activity: "- You said '${turn.activity.text}'",
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = DialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(1);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.adds[0].name).toEqual('SendActivity_Y39scR');
    expect(changes.lg.adds[0].body).toEqual("- You said '${turn.activity.text}'");
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('add an intent', () => {
    const vdialog1 = DialogConverter(dialogFile, lgFileResolver, luFileResolver);
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
            },
          ],
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = DialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(0);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lu.updates.length).toEqual(0);
    expect(changes.lu.adds.length).toEqual(1);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('copy a TextInput', () => {
    const vdialog1 = DialogConverter(dialogFile, lgFileResolver, luFileResolver);
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
          defaultValueResponse: '- 6',
          disabled: false,
          invalidPrompt: '- 5',
          maxTurnCount: 3,
          prompt: '- 1',
          unrecognizedPrompt: '- 4',
          _virtual_luis_body: '-23',
          _virtual_luis_name: 'TextInput_Response_96TcCU', // may no need
        },
      },
    ];

    const vdialog2 = JsonInsert(vdialog1, insert1);

    const changes = DialogResourceChanges(vdialog1, vdialog2);
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
});