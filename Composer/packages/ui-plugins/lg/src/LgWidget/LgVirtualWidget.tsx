// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import get from 'lodash/get';
import { WidgetContainerProps } from '@bfc/extension';

export interface LgVirtualWidgetProps extends WidgetContainerProps {
  /** indicates which field contains lg activity. ('activity', 'prompt', 'invalidPropmt'...) */
  field: string;
  defaultContent?: string;
}

export const LgVirtualWidget: React.FC<LgVirtualWidgetProps> = ({ data, field, defaultContent }) => {
  const templateText = get(data, field, '');
  const displayedText = templateText || defaultContent;
  return <>{displayedText}</>;
};
