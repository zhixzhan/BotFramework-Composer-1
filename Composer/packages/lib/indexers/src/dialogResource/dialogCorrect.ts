// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import has from 'lodash/has';
import { DialogDiff } from '@bfc/shared';
import { JsonWalk, VisitorFunc, LgTemplateRef } from '@bfc/shared';
import { JsonSet } from '@bfc/shared/lib/jsonDiff/helper';

import { LGTemplateFields } from './constants';
import { getFeildLgRefName } from './helper';

export function DialogCorrectLgRef(dialog) {
  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (has(value, '$kind')) {
      LGTemplateFields.forEach((field) => {
        if (has(value, field)) {
          const lgName = getFeildLgRefName(value, field);
          const expectedLgTemplateRef = new LgTemplateRef(lgName).toString();
          value[field] = expectedLgTemplateRef;
        }
      });
    }
    return false;
  };
  JsonWalk('$', dialog, visitor);
}

export function DialogCorrect(
  prevDialog: {
    [key: string]: any;
  },
  currDialog: {
    [key: string]: any;
  }
): {
  [key: string]: any;
} {
  const { adds } = DialogDiff(prevDialog, currDialog);
  for (const item of adds) {
    DialogCorrectLgRef(item.value);
  }
  return JsonSet(currDialog, adds);
}
