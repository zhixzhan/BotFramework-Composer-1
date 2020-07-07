// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import has from 'lodash/has';
import get from 'lodash/get';
import { SDKKinds, LgType, LgMetaData, LgTemplateRef, LuType, LuMetaData } from '@bfc/shared';

import { LUSDKKinds, LGTemplateFields } from './constants';

export const getFeildLgRefName = (data, field): string => {
  const $kind = data?.$kind;
  const designerId = get(data, '$designer.id');
  if (!$kind || !designerId) return '';
  const lgType = new LgType($kind, field).toString();
  return new LgMetaData(lgType, designerId).toString();
};

export const getContainsLuName = (data): string | undefined => {
  const $kind = data?.$kind;
  const designerId = get(data, '$designer.id');
  if (!$kind || !designerId) return;

  if ($kind === SDKKinds.OnIntent) {
    return data.intent;
  } else if (LUSDKKinds.includes($kind)) {
    const relatedLuIntentType = new LuType($kind).toString();
    return new LuMetaData(relatedLuIntentType, designerId).toString();
  }
};

export const serializeLgRefByDesignerId = (value) => {
  if (has(value, '$kind')) {
    LGTemplateFields.forEach((field) => {
      if (has(value, field)) {
        const lgName = getFeildLgRefName(value, field);
        value[field] = new LgTemplateRef(lgName).toString();
      }
    });
  }
};

export const recognizerType = (dialog: any): string | null => {
  const { recognizer } = dialog;

  if (recognizer) {
    if (typeof recognizer === 'object' && recognizer.$kind === SDKKinds.RegexRecognizer) {
      return SDKKinds.RegexRecognizer;
    } else if (typeof recognizer === 'string') {
      return SDKKinds.LuisRecognizer;
    }
  }
  return null;
};
