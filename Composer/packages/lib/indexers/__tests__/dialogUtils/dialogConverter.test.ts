// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';

import get from 'lodash/get';

import { DialogConverter } from '../../src/dialogUtils/dialogConverter';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const dialogFile = JSON.parse(fs.readFileSync(`${__dirname}/data/todobotwithluissample.dialog`, 'utf-8'));
const lgFile = lgIndexer.parse(
  fs.readFileSync(`${__dirname}/data/language-generation/en-us/todobotwithluissample.en-us.lg`, 'utf-8')
);
const luFile = luIndexer.parse(
  fs.readFileSync(`${__dirname}/data/language-understanding/en-us/todobotwithluissample.en-us.lu`, 'utf-8')
);

describe('Convert dialog into virtual dialog', () => {
  it('should check if the diagnostics have errors', () => {
    const lgFileResolver = () => {
      return lgFile;
    };

    const luFileResolver = () => {
      return luFile;
    };

    const convertedDialog = DialogConverter(dialogFile, lgFileResolver, luFileResolver);

    expect(get(convertedDialog, 'triggers[0].actions[0].actions[0].actions[0].activity')).toEqual(
      '${SendActivity_202664()}'
    );
    expect(get(convertedDialog, 'triggers[0].actions[0].actions[0].actions[0]._virtual_activity')).toContain(
      '[Activity'
    );

    expect(get(convertedDialog, 'triggers[6].actions[0].prompt')).toEqual('${TextInput_Prompt_107784()}');
    expect(get(convertedDialog, 'triggers[6].actions[0]._virtual_prompt')).toContain(
      '- Are you sure you want to cancel?'
    );

    expect(get(convertedDialog, 'triggers[1].intent')).toEqual('Add');
    expect(get(convertedDialog, 'triggers[1]._virtual_intent')).toContain('- Add todo');
  });
});
