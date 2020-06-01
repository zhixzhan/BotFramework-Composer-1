/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import get from 'lodash/get';
import { SDKKinds } from '@bfc/shared';

import { VirtualLGPropName, VirtualLUPropName } from '../../src/virtualDialog/constants';
import { VirtualDialogConverter, VirtualDialogConverterReverse, VirtualSchemaConverter } from '../../src/virtualDialog';
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
