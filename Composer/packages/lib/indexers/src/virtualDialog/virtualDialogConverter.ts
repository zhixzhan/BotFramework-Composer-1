// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import cloneDeep from 'lodash/cloneDeep';
import { extractLgTemplateRefs, SDKKinds, LgTemplateRef, JsonWalk, VisitorFunc } from '@bfc/shared';

import { getBaseName } from '../utils/help';

import { LGTemplateFields, LUSDKKinds } from './constants';
import { setVirtualLG, setVirtualLuis, getContainsLuName, getFeildLgRefName, recognizerType } from './helper';

export function VirtualDialogConverter(
  dialog: {
    [key: string]: any;
  },
  lgFileResolver,
  luFileResolver
): {
  [key: string]: any;
} {
  const lgFileName = typeof dialog.generator === 'string' ? dialog.generator : '';
  const lgFileId = getBaseName(lgFileName, '.lg');
  const lgTemplates = lgFileResolver(lgFileId)?.templates;

  let luIntents;

  const intentType = recognizerType(dialog);
  if (intentType === SDKKinds.RegexRecognizer) {
    luIntents = dialog?.recognizer?.intents.map(({ intent, pattern }) => {
      return {
        Name: intent,
        Body: pattern,
      };
    });
  } else if (intentType === SDKKinds.LuisRecognizer) {
    const luFileName = typeof dialog.recognizer === 'string' ? dialog.recognizer : '';
    const luFileId = getBaseName(luFileName, '.lu');
    luIntents = luFileResolver(luFileId)?.intents;
  }

  const vDialog = cloneDeep(dialog);
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const $kind = value.$kind;
      if (lgTemplates) {
        LGTemplateFields.forEach(field => {
          if (has(value, field)) {
            const propValue = value[field];
            let vPropValue = '- ';
            let lgName = '';
            const lgTemplateRef = extractLgTemplateRefs(propValue);

            // activity: '' is empty, slot default
            if (lgTemplateRef.length === 0) {
              lgName = getFeildLgRefName(value, field);
              value[field] = new LgTemplateRef(lgName).toString();
            }
            // activity: "${SendActivity_34235}"
            else if (lgTemplateRef.length === 1) {
              lgName = lgTemplateRef[0].name;
            }

            const lgTemplate = lgTemplates.find(t => t.name === lgName);
            // refered lg is in same name lg File.
            if (lgTemplate) {
              vPropValue = lgTemplate.body;
            }
            setVirtualLG(value, field, vPropValue);
          }
        });
      }

      if (luIntents && LUSDKKinds.includes($kind)) {
        const luName = getContainsLuName(value);
        const luBody = luIntents && luName && luIntents.find(t => t.Name === luName)?.Body; // else find in trigger
        setVirtualLuis(value, luName, luBody);
      }
    }
    return false;
  };
  JsonWalk('$', vDialog, visitor);

  return vDialog;
}
