// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LgTemplate, LuIntentSection } from '@bfc/shared';
import has from 'lodash/has';
import { extractLgTemplateRefs, SDKKinds, JsonWalk, VisitorFunc } from '@bfc/shared';
import { getWithJsonPath } from '@bfc/shared/lib/jsonDiff/helper';

import { getBaseName } from '../utils/help';

import { LGTemplateFields, LUSDKKinds } from './constants';
import { getContainsLuName, recognizerType } from './helper';

type DialogResourceOptions = {
  lgFileResolver: any;
  luFileResolver: any;
  path?: string;
};

export function DialogResource(
  dialog: {
    [key: string]: any;
  },
  { lgFileResolver, luFileResolver, path }: DialogResourceOptions
): {
  lg: LgTemplate[];
  lu: LuIntentSection[];
} {
  const lgFileName = typeof dialog.generator === 'string' ? dialog.generator : '';
  const lgFileId = getBaseName(lgFileName, '.lg');
  const allLGTemplates = lgFileResolver(lgFileId)?.templates;

  let allLUIntents;

  const intentType = recognizerType(dialog);
  if (intentType === SDKKinds.RegexRecognizer) {
    allLUIntents = dialog?.recognizer?.intents?.map(({ intent, pattern }) => {
      return {
        Name: intent,
        Body: pattern,
      };
    });
  } else if (intentType === SDKKinds.LuisRecognizer) {
    const luFileName = typeof dialog.recognizer === 'string' ? dialog.recognizer : '';
    const luFileId = getBaseName(luFileName, '.lu');
    allLUIntents = luFileResolver(luFileId)?.intents;
  }

  const dialogReferredLGNames: string[] = [];
  const dialogReferredLUNames: string[] = [];

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const $kind = value.$kind;
      if (allLGTemplates) {
        LGTemplateFields.forEach((field) => {
          if (has(value, field)) {
            const propValue = value[field];
            let lgName = '';
            const lgTemplateRef = extractLgTemplateRefs(propValue);
            // activity: "${SendActivity_34235}"
            if (lgTemplateRef.length === 1) {
              lgName = lgTemplateRef[0].name;
            }
            if (lgName) dialogReferredLGNames.push(lgName);
          }
        });
      }

      if (LUSDKKinds.includes($kind)) {
        const luName = getContainsLuName(value);
        if (luName) dialogReferredLUNames.push(luName);
      }
    }
    return false;
  };

  const jsonData = path ? getWithJsonPath(dialog, path) : dialog;
  JsonWalk('$', jsonData, visitor);
  const lg = allLGTemplates ? allLGTemplates.filter(({ name }) => dialogReferredLGNames.includes(name)) : [];
  const lu = allLUIntents ? allLUIntents.filter(({ Name }) => dialogReferredLUNames.includes(Name)) : [];

  return { lg, lu };
}
