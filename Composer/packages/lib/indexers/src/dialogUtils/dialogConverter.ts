// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import cloneDeep from 'lodash/cloneDeep';
import { extractLgTemplateRefs, SDKKinds } from '@bfc/shared';

import { JsonWalk, VisitorFunc } from '../utils/jsonWalk';
import { getBaseName } from '../utils/help';

export const VPropsPrefix = '_virtual_';

export const getVPropsByField = (data, field) => {
  const virtualField = `${VPropsPrefix}${field}`;
  return data[virtualField];
};

export const setVPropsByField = (data, field, fieldValue) => {
  const virtualField = `${VPropsPrefix}${field}`;
  data[virtualField] = fieldValue;
  return data;
};

export function DialogConverter(
  dialog: {
    [key: string]: any;
  },
  lgFileResolver,
  luFileResolver
): {
  [key: string]: any;
} {
  const luFileName = typeof dialog.recognizer === 'string' ? dialog.recognizer : '';
  const lgFileName = typeof dialog.generator === 'string' ? dialog.generator : '';
  const luFileId = getBaseName(luFileName, '.lu');
  const lgFileId = getBaseName(lgFileName, '.lg');

  const lgFile = lgFileResolver(lgFileId);
  const luFile = luFileResolver(luFileId);

  const deDialog = cloneDeep(dialog);
  /**
   *
   * @param path , jsonPath string
   * @param value , current node value    *
   * @return boolean, true to stop walk    */
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    // it's a valid schema dialog node.
    if (has(value, '$kind')) {
      if (lgFile) {
        // find lg templates and add _virtial_[prop]
        ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity'].forEach(field => {
          if (has(value, field)) {
            const lgTemplateRef = extractLgTemplateRefs(value[field]);
            // only replace single lgTemplateRef case "${}"
            if (lgTemplateRef.length === 1) {
              const lgTemplate = lgFile.templates.find(t => t.name === lgTemplateRef[0].name);
              // refered lg is in same name lg File.
              if (lgTemplate) {
                setVPropsByField(value, field, lgTemplate.body);
              }
            }
          }
        });
      }

      if (luFile) {
        // find lu
        if (value.$kind === SDKKinds.OnIntent) {
          const field = 'intent';
          const intentName = value[field];
          const intent = luFile ? luFile.intents.find(t => t.Name === intentName) : undefined; // else find in trigger
          if (intent) {
            setVPropsByField(value, field, intent.Body);
          }
        }
      }
    }
    return false;
  };
  JsonWalk('$', deDialog, visitor);

  return deDialog;
}
