// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import { SDKKinds, JsonWalk, VisitorFunc } from '@bfc/shared';

import {
  LGTemplateFields,
  LUIntentFields,
  VirtualLGPropName,
  VirtualLUPropName,
  VirtualLG,
  VirtualLU,
} from './constants';

export function VirtualSchemaConverter(schema: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const vSchema = cloneDeep(schema);
  vSchema.definitions[SDKKinds.VirtualLG] = VirtualLG;
  vSchema.definitions[SDKKinds.VirtualLU] = VirtualLU;

  const vProperties: any[] = [];
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // extend sdk schema properties with virtual properties
    const properties = get(value, 'properties');
    if (properties && typeof properties === 'object') {
      const virtualLg: any = {};
      const virtualLu: any = {};
      const path = _path
        .replace(/^\$\.?/, '')
        .split(/[\[\]]/)
        .filter(p => !!p);
      for (const [propName, propValue] of Object.entries(properties)) {
        if (typeof propValue !== 'object') continue;

        if (LGTemplateFields.includes(propName)) {
          virtualLg[propName] = propValue;
        }

        if (LUIntentFields.includes(propName)) {
          virtualLu.name = { type: 'string', title: 'virtual lu name' };
          virtualLu.body = { type: 'string', title: 'virtual lu body' };
        }
      }

      if (Object.keys(virtualLg).length) {
        vProperties.push({
          path: [...path, 'properties', VirtualLGPropName],
          value: {
            properties: virtualLg,
            $kind: SDKKinds.VirtualLG,
            $ref: `#/definitions/${SDKKinds.VirtualLG}`,
          },
        });
      }
      if (Object.keys(virtualLu).length) {
        vProperties.push({
          path: [...path, 'properties', VirtualLUPropName],
          value: {
            properties: virtualLu,
            $kind: SDKKinds.VirtualLU,
            $ref: `#/definitions/${SDKKinds.VirtualLU}`,
          },
        });
      }

      // set(value, 'properties', properties);
    }
    return false;
  };
  JsonWalk('$', vSchema, visitor);

  for (const vProp of vProperties) {
    const { path, value } = vProp;
    set(vSchema, path, value);
  }

  return vSchema;
}
