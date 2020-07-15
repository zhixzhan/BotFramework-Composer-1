// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import has from 'lodash/has';
import set from 'lodash/set';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import { JsonWalk, VisitorFunc, getDesignerId, LgTemplate, LuIntentSection, LgTemplateRef } from '@bfc/shared';
import { getWithJsonPath } from '@bfc/shared/lib/jsonDiff/helper';

import { LGTemplateFields } from './constants';
import { DialogResource, DialogResourceOptions } from './dialogResource';
import { getContainsLuName, getFeildLgRefName } from './helper';

export function copyAdaptiveNodes(
  dialog,
  { lgFiles, luFiles, path }: DialogResourceOptions
): {
  newNodes: any;
  lg: LgTemplate[];
  lu: LuIntentSection[];
} {
  const lg: LgTemplate[] = [];
  const lu: LuIntentSection[] = [];

  const resource = DialogResource(dialog, { lgFiles, luFiles, path });

  const jsonData = path ? getWithJsonPath(dialog, path) : dialog;

  const newNodes = cloneDeep(jsonData);

  // generate new designer id
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const dialogItem = value;
      const designerData = get(dialogItem, '$designer');
      if (designerData) {
        const newDisgnerData = getDesignerId(designerData);

        if (!isEmpty(resource.lg)) {
          LGTemplateFields.forEach((field) => {
            if (has(dialogItem, field)) {
              const lgName = getFeildLgRefName(dialogItem, field);
              const newLgName = getFeildLgRefName({ ...dialogItem, $designer: newDisgnerData }, field);
              const template = resource.lg.find((item) => item.name === lgName);
              if (template)
                lg.push({
                  ...template,
                  name: newLgName,
                });
              // reset lg ref
              dialogItem[field] = new LgTemplateRef(newLgName).toString();
            }
          });
        }

        if (!isEmpty(resource.lu)) {
          const luName = getContainsLuName(dialogItem);
          const newLuName = getContainsLuName({ ...dialogItem, $designer: newDisgnerData });

          if (luName && newLuName) {
            const intent = resource.lu.find((item) => item.Name === luName);
            if (intent)
              lu.push({
                ...intent,
                Name: newLuName,
              });
          }
        }

        // reset designer id
        set(dialogItem, '$designer', newDisgnerData);
      }
    }
    return false;
  };

  JsonWalk('$', newNodes, visitor);

  return {
    newNodes,
    lg,
    lu,
  };
}
