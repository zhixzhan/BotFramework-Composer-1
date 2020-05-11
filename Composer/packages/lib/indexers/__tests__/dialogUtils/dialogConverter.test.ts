// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';

import { DialogConverter } from '../../src/dialogUtils/dialogConverter';
import { lgIndexer } from '../../src/lgIndexer';
import { luIndexer } from '../../src/luIndexer';

const showtodoDialog = JSON.parse(fs.readFileSync(`${__dirname}/data/showtodos/showtodos.dialog`, 'utf-8'));
const showtodoLg = lgIndexer.parse(
  fs.readFileSync(`${__dirname}/data/showtodos/language-generation/en-us/showtodos.en-us.lg`, 'utf-8')
);
const showtodoLu = luIndexer.parse(
  fs.readFileSync(`${__dirname}/data/showtodos/language-understanding/en-us/showtodos.en-us.lu`, 'utf-8')
);

describe('Convert dialog into virtual dialog', () => {
  it('should check if the diagnostics have errors', () => {
    const lgFileResolver = () => {
      return showtodoLg;
    };

    const luFileResolver = () => {
      return showtodoLu;
    };

    const convertedDialog = DialogConverter(showtodoDialog, lgFileResolver, luFileResolver);

    expect(convertedDialog).toEqual({});
  });
});
