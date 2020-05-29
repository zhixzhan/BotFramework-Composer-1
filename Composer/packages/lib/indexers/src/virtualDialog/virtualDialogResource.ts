// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import { LgTemplate, LuIntentSection, JsonWalk, VisitorFunc } from '@bfc/shared';

import { LGTemplateFields, VirtualLGPropName, VirtualLUPropName } from './constants';
import { getVirtualLuis, getContainsLuName, getFeildLgRefName } from './helper';

export function VirtualDialogResource(
  dialog
): {
  lg: LgTemplate[];
  lu: LuIntentSection[];
} {
  const lg: LgTemplate[] = [];
  const lu: LuIntentSection[] = [];

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const dialogItem = value;
      const virtualLgItem = value[VirtualLGPropName];
      const virtualLuItem = value[VirtualLUPropName];
      if (virtualLgItem) {
        Object.keys(virtualLgItem).forEach(propName => {
          const propValue = virtualLgItem[propName];
          if (propValue) {
            if (LGTemplateFields.includes(propName)) {
              const lgName = getFeildLgRefName(dialogItem, propName); // TODO: double check with vPropValue
              const lgBody = propValue;
              const lgTemplate: LgTemplate = { name: lgName, body: lgBody, parameters: [] };
              lg.push(lgTemplate);
            }
          }
        });
      }

      if (virtualLuItem) {
        const luName = getContainsLuName(dialogItem);
        if (luName) {
          const { Body } = getVirtualLuis(dialogItem);
          const luIntent: LuIntentSection = { Name: luName, Body };
          lu.push(luIntent);
        }
      }
    }
    return false;
  };
  JsonWalk('$', dialog, visitor);

  return {
    lg,
    lu,
  };
}
