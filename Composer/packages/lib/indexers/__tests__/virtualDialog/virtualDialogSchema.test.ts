// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import fs from 'fs';
import path from 'path';

import get from 'lodash/get';
import { SDKKinds } from '@bfc/shared';

import { VirtualLGPropName } from '../../src/virtualDialog/constants';
import { VirtualSchemaConverter } from '../../src/virtualDialog';

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data_/schemas/sdk.schema'), 'utf-8'));

describe('Virtual Schema Convert', () => {
  it('can convert normal schema into virtual schema', () => {
    const schema1 = VirtualSchemaConverter(schema);
    expect(get(schema1, ['definitions', SDKKinds.VirtualLG, 'title'])).toEqual('Virtual LG');
    const askWithVirtual = get(schema1, ['definitions', SDKKinds.Ask, 'properties', VirtualLGPropName]);
    expect(get(askWithVirtual, 'properties.activity.$kind')).toEqual(SDKKinds.IActivityTemplate);
  });
});
