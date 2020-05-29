/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import get from 'lodash/get';
import { SDKKinds } from '@bfc/shared';
import { JsonSet, JsonInsert } from '@bfc/shared';

import { VirtualLGPropName, VirtualLUPropName } from '../../src/virtualDialog/constants';
import {
  VirtualDialogConverter,
  VirtualDialogConverterReverse,
  VirtualDialogResourceChanges,
  VirtualDialogResource,
  VirtualSchemaConverter,
} from '../../src/virtualDialog';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data_/schemas/sdk.schema'), 'utf-8'));
const dialogFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../_data_/todobotwithluissample.test.dialog'), 'utf-8')
);
const dialogFile2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data_/todobotsample.test.dialog'), 'utf-8'));
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

describe('Virtual Schema Convert', () => {
  it('can convert normal schema into virtual schema', () => {
    const schema1 = VirtualSchemaConverter(schema);
    expect(get(schema1, ['definitions', SDKKinds.VirtualLG, 'title'])).toEqual('Virtual LG');
    const askWithVirtual = get(schema1, ['definitions', SDKKinds.Ask, 'properties', VirtualLGPropName]);
    expect(get(askWithVirtual, 'properties.activity.$kind')).toEqual(SDKKinds.IActivityTemplate);
  });
});

describe('Virtual Dialog Convert', () => {
  it('should convert dialog -> virtual dialog (with luis recognizer)', () => {
    const convertedDialog = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);

    expect(get(convertedDialog, 'triggers[0].actions[0].actions[0].actions[0].activity')).toEqual(
      '${SendActivity_202664()}'
    );
    const vItem1 = get(convertedDialog, `triggers[0].actions[0].actions[0].actions[0].${VirtualLGPropName}`);

    expect(vItem1.activity).toContain('[Activity');

    const vItem2 = get(convertedDialog, `triggers[0].actions[0].actions[0].actions[1].${VirtualLGPropName}`);
    expect(vItem2.activity).toEqual('- ');

    const vItem3 = get(convertedDialog, `triggers[6].actions[0].${VirtualLGPropName}`);
    expect(vItem3.prompt).toContain('- Are you sure you want to cancel?');

    const vItem4 = get(convertedDialog, `triggers[1].${VirtualLUPropName}`);
    expect(get(convertedDialog, 'triggers[1].intent')).toEqual('Add');
    expect(vItem4.name).toEqual('Add');
    expect(vItem4.body).toContain('- Add todo');
  });

  it('should convert dialog -> virtual dialog (with regexp recognizer)', () => {
    const convertedDialog = VirtualDialogConverter(dialogFile2, lgFileResolver, luFileResolver);
    const intents = get(convertedDialog, 'recognizer.intents');

    const vItem = get(convertedDialog, `triggers[1].${VirtualLUPropName}`);
    expect(get(convertedDialog, 'triggers[1].intent')).toEqual('AddIntent');
    expect(vItem.name).toEqual('AddIntent');
    expect(vItem.body).toEqual(intents.find(({ intent }) => intent === 'AddIntent')?.pattern);
  });

  it('should convert virtual dialog -> dialog', () => {
    const convertedDialog = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const reverseConvertedDialog = VirtualDialogConverterReverse(convertedDialog);
    expect(reverseConvertedDialog).toEqual(dialogFile);
  });
});

describe('Virtual Dialog Resources Changes', () => {
  it('update by virtual property', () => {
    const vdialog1 = VirtualDialogConverter(dialogFile, lgFileResolver, luFileResolver);
    const insert1 = [
      { path: `triggers[0].actions[0].actions[0].actions[0].${VirtualLGPropName}.activity`, value: '- updated!' },
      { path: `triggers[6].actions[0].${VirtualLGPropName}.prompt`, value: '- propmpt updated!' },
      { path: `triggers[6].actions[0].${VirtualLUPropName}.body`, value: '- lu body updated!' },
    ];

    const vdialog2 = JsonSet(vdialog1, insert1);

    const changes = VirtualDialogResourceChanges(vdialog1, vdialog2);
    expect(changes.lg.updates.length).toEqual(2);
    expect(changes.lg.adds.length).toEqual(0);
    expect(changes.lg.deletes.length).toEqual(0);
    expect(changes.lg.updates[0].name).toEqual('SendActivity_202664');
    expect(changes.lg.updates[0].body).toEqual('- updated!');
    expect(changes.lg.updates[1].name).toEqual('ConfirmInput_Prompt_107784');
    expect(changes.lg.updates[1].body).toEqual('- propmpt updated!');
    expect(changes.lu.updates.length).toEqual(1);
    expect(changes.lu.updates[0].Name).toEqual('ConfirmInput_Response_107784');
    expect(changes.lu.updates[0].Body).toEqual('- lu body updated!');
    expect(changes.lu.adds.length).toEqual(0);
    expect(changes.lu.deletes.length).toEqual(0);
  });

  it('add by virtual property', () => {
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

  it('add an intent', () => {
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

  it('copy a TextInput', () => {
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
});

describe('VirtualDialogResource', () => {
  it('resource in virtual dialog', () => {
    const virtualDialog = {
      $kind: 'Microsoft.AdaptiveDialog',
      $designer: {
        id: '6uQuGV',
        name: 'm7',
        description: '',
      },
      autoEndDialog: true,
      defaultResultProperty: 'dialog.result',
      triggers: [
        {
          $kind: 'Microsoft.OnBeginDialog',
          $designer: {
            name: 'BeginDialog',
            description: '',
            id: 'Sdvm07',
          },
          actions: [
            {
              $kind: 'Microsoft.SendActivity',
              $designer: {
                id: 'WezpV5',
              },
              activity: '${SendActivity_c7Wg7i()}',
              [VirtualLGPropName]: {
                activity: '- hello',
              },
            },
          ],
        },
      ],
      generator: 'm7.lg',
    };

    const resources = VirtualDialogResource(virtualDialog);
    expect(resources.lg.length).toEqual(1);
    expect(resources.lg[0]).toEqual({ name: 'SendActivity_WezpV5', body: '- hello', parameters: [] });
    expect(resources.lu.length).toEqual(0);
  });
});
