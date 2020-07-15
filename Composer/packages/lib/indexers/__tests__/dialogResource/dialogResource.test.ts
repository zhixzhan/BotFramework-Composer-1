/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import cloneDeep from 'lodash/cloneDeep';
import { JsonInsert } from '@bfc/shared';

import { DialogResource } from '../../src/dialogResource';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const dialogFile = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../_bots_/_test_todobotwithluissample/todobotwithluissample.test.dialog'),
    'utf-8'
  )
);

const lgFiles = lgIndexer.index([
  {
    name: 'todobotwithluissample.en-us.lg',
    content: fs.readFileSync(
      path.join(
        __dirname,
        '../_bots_/_test_todobotwithluissample/language-generation/en-us/todobotwithluissample.en-us.lg'
      ),
      'utf-8'
    ),
    path: '',
    relativePath: '',
    lastModified: '',
  },
]);
const luFiles = luIndexer.index([
  {
    name: 'todobotwithluissample.en-us.lu',
    content: fs.readFileSync(
      path.join(
        __dirname,
        '../_bots_/_test_todobotwithluissample/language-understanding/en-us/todobotwithluissample.en-us.lu'
      ),
      'utf-8'
    ),
    path: '',
    relativePath: '',
    lastModified: '',
  },
]);

describe('Rsources in dialog', () => {
  it('should find LG/LU resource in part of dialog', () => {
    const dialog1 = [
      {
        $kind: 'Microsoft.SendActivity',
        $designer: {
          id: '037398',
          name: 'Send a response',
        },
        activity: '${SendActivity_037398()}',
      },
    ];

    const resources = DialogResource(dialog1, { lgFiles, luFiles });

    expect(resources.lg.length).toEqual(1);
    expect(resources.lg[0].name).toEqual('SendActivity_037398');
    expect(resources.lg[0].body).toContain('- Sorry, not sure what you mean. Can you rephrase?');
    expect(resources.lu.length).toEqual(0);
  });

  it('should find LG/LU resource in dialog', () => {
    const dialog = cloneDeep(dialogFile);
    const resources = DialogResource(dialog, { lgFiles, luFiles });
    expect(dialog).toEqual(dialogFile);
    expect(resources.lg.length).toEqual(9);
    expect(resources.lg[4].name).toEqual('SendActivity_037398');
    expect(resources.lg[4].body).toContain('- Sorry, not sure what you mean. Can you rephrase?');
    expect(resources.lu.length).toEqual(8);
    expect(resources.lu[0].Name).toEqual('Add');
    expect(resources.lu[0].Body).toContain('- Add todo');
    expect(resources.lu[6].Name).toEqual('ConfirmInput_Response_107784');
    expect(resources.lu[6].Body).toContain('- yes');
  });

  it('when copy/paste action, should find LG/LU resource', () => {
    const dialog = cloneDeep(dialogFile);
    const insert1 = [
      {
        path: 'triggers[7].actions[1]',
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

    const dialog2 = JsonInsert(dialog, insert1);

    const resources = DialogResource(dialog2, { lgFiles, luFiles });
    expect(dialog).toEqual(dialogFile);
    expect(resources.lg.length).toEqual(10);
    expect(resources.lg[5].name).toEqual('SendActivity_037398');
    expect(resources.lg[5].body).toContain('- Sorry, not sure what you mean. Can you rephrase?');
    expect(resources.lu.length).toEqual(8);
    expect(resources.lu[0].Name).toEqual('Add');
    expect(resources.lu[0].Body).toContain('- Add todo');
    expect(resources.lu[6].Name).toEqual('ConfirmInput_Response_107784');
    expect(resources.lu[6].Body).toContain('- yes');
  });
});
