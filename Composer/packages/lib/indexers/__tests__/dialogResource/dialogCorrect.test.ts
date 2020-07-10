/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';

import cloneDeep from 'lodash/cloneDeep';
import { JsonSet, JsonInsert, JsonDiff } from '@bfc/shared';

import { DialogCorrectLgRef, DialogCorrect } from '../../src/dialogResource';

const dialogFile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../_bots_/_test_todobotwithluissample/todobotwithluissample.test.dialog'),
    'utf-8'
  )
);

describe('Correct rsources ref in dialog', () => {
  it('when copy/paste SendActivity, should correct LG ref', () => {
    const dialog = {
      $kind: 'Microsoft.SendActivity',
      $designer: {
        id: 'newid1',
        name: 'Send a response',
      },
      activity: '${SendActivity_037398()}',
    };

    DialogCorrectLgRef(dialog);
    expect(dialog.activity).toEqual('${SendActivity_newid1()}');
  });

  it('when copy/paste Prompt, should correct LG ref', () => {
    const dialog = {
      $kind: 'Microsoft.TextInput',
      $designer: {
        id: 'NEWID2',
      },
      allowInterruptions: false,
      alwaysPrompt: false,
      prompt: '${TextInput_Prompt_96TcCU()}',
      unrecognizedPrompt: '${TextInput_UnrecognizedPrompt_96TcCU()}',
      invalidPrompt: '${TextInput_InvalidPrompt_96TcCU()}',
      defaultValueResponse: '${TextInput_DefaultValueResponse_96TcCU()}',
      disabled: false,
      maxTurnCount: 3,
    };

    DialogCorrectLgRef(dialog);
    expect(dialog.prompt).toEqual('${TextInput_Prompt_NEWID2()}');
    expect(dialog.unrecognizedPrompt).toEqual('${TextInput_UnrecognizedPrompt_NEWID2()}');
    expect(dialog.invalidPrompt).toEqual('${TextInput_InvalidPrompt_NEWID2()}');
    expect(dialog.defaultValueResponse).toEqual('${TextInput_DefaultValueResponse_NEWID2()}');
  });
});

describe('Correct rsources when update dialog', () => {
  it('when copy/paste SendActivity, should correct LG ref', () => {
    const dialog1 = cloneDeep(dialogFile);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.SendActivity',
          $designer: {
            id: 'newid1',
          },
          activity: '${SendActivity_202664()}',
        },
      },
    ];

    const dialog2 = JsonInsert(dialog1, insert1);
    const dialog3 = DialogCorrect(dialog1, dialog2);
    expect(dialog2.triggers[6].actions[0].activity).toEqual('${SendActivity_202664()}');
    expect(dialog3.triggers[6].actions[0].activity).toEqual('${SendActivity_newid1()}');
  });

  it('when copy/paste Prompt, should correct LG ref', () => {
    const dialog1 = cloneDeep(dialogFile);
    const insert1 = [
      {
        path: 'triggers[6].actions[0]',
        value: {
          $kind: 'Microsoft.TextInput',
          $designer: {
            id: 'NEWID2',
          },
          allowInterruptions: false,
          alwaysPrompt: false,
          prompt: '${TextInput_Prompt_96TcCU()}',
          unrecognizedPrompt: '${TextInput_UnrecognizedPrompt_96TcCU()}',
          invalidPrompt: '${TextInput_InvalidPrompt_96TcCU()}',
          defaultValueResponse: '${TextInput_DefaultValueResponse_96TcCU()}',
          disabled: false,
          maxTurnCount: 3,
        },
      },
    ];

    const dialog2 = JsonInsert(dialog1, insert1);
    const dialog3 = DialogCorrect(dialog1, dialog2);

    expect(dialog3.triggers[6].actions[0].prompt).toEqual('${TextInput_Prompt_NEWID2()}');
    expect(dialog3.triggers[6].actions[0].unrecognizedPrompt).toEqual('${TextInput_UnrecognizedPrompt_NEWID2()}');
    expect(dialog3.triggers[6].actions[0].invalidPrompt).toEqual('${TextInput_InvalidPrompt_NEWID2()}');
    expect(dialog3.triggers[6].actions[0].defaultValueResponse).toEqual('${TextInput_DefaultValueResponse_NEWID2()}');
  });
});
