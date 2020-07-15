// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LgTemplate, LuIntentSection, LgFile, LuFile } from '@bfc/shared';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import { extractLgTemplateRefs, SDKKinds, JsonWalk, VisitorFunc } from '@bfc/shared';
import { getWithJsonPath } from '@bfc/shared/lib/jsonDiff/helper';

import { LGTemplateFields, LUSDKKinds } from './constants';
import { getContainsLuName, getFeildLgRefName, recognizerType } from './helper';

export type DialogResourceOptions = {
  lgFiles: LgFile[];
  luFiles: LuFile[];
  path?: string;
};

export function DialogResource(
  dialog: {
    [key: string]: any;
  },
  { lgFiles, luFiles, path }: DialogResourceOptions
): {
  lg: LgTemplate[];
  lu: LuIntentSection[];
} {
  const allLGTemplates = lgFiles.reduce((result: LgTemplate[], { templates }) => {
    return result.concat(templates);
  }, []);

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
    allLUIntents = luFiles.reduce((result: LuIntentSection[], { intents }) => {
      return result.concat(intents);
    }, []);
  }

  const lg: LgTemplate[] = [];
  const lu: LuIntentSection[] = [];

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      const $kind = value.$kind;
      if (allLGTemplates) {
        LGTemplateFields.forEach((field) => {
          if (has(value, field)) {
            const propValue = value[field];
            const lgName = getFeildLgRefName(value, field);
            const lgTemplateRef = extractLgTemplateRefs(propValue);
            const refLgName = lgTemplateRef[0]?.name;
            const targetName = refLgName === lgName ? lgName : refLgName;
            const template = allLGTemplates.find(({ name }) => targetName === name);

            if (template) lg.push({ ...template, name: lgName });
          }
        });
      }

      if (!isEmpty(allLUIntents) && LUSDKKinds.includes($kind)) {
        const luName = getContainsLuName(value);
        const intent = allLUIntents.find(({ Name }) => luName === Name);
        if (intent) lu.push(intent);
      }
    }
    return false;
  };

  const jsonData = path ? getWithJsonPath(dialog, path) : dialog;
  JsonWalk('$', jsonData, visitor);

  return { lg, lu };
}
