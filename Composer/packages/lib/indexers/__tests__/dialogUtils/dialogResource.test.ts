/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import { DialogResource } from '../../src/dialogUtils/dialogResource';
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

describe('Rsources in dialog', () => {
  it('should find LG/LU resource in dialog', () => {
    const resources = DialogResource(dialogFile, { lgFileResolver, luFileResolver });
    expect(resources.lg.length).toEqual(5);
    expect(resources.lg[4].name).toEqual('SendActivity_037398');
    expect(resources.lg[4].body).toContain('- Sorry, not sure what you mean. Can you rephrase?');
    expect(resources.lu.length).toEqual(7);
    expect(resources.lu[0].Name).toEqual('Add');
    expect(resources.lu[0].Body).toContain('- Add todo');
    expect(resources.lu[6].Name).toEqual('ConfirmInput_Response_107784');
    expect(resources.lu[6].Body).toContain('- yes');
  });
});
