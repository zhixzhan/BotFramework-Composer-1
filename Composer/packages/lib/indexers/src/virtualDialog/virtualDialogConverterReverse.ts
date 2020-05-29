// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import cloneDeep from 'lodash/cloneDeep';
import { JsonWalk, VisitorFunc } from '@bfc/shared';

import { unsetVirtualProps, serilizeLgRefByDesignerId } from './helper';

export function VirtualDialogConverterReverse(dialog: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const vDialog = cloneDeep(dialog);

  const visitor: VisitorFunc = (_path: string, value: any): boolean => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(key => {
        unsetVirtualProps(value);
      });
      serilizeLgRefByDesignerId(value); // TODO: double check
    }
    return false;
  };
  JsonWalk('$', vDialog, visitor);

  return vDialog;
}
