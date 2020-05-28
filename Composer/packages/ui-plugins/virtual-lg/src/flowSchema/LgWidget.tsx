// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { WidgetContainerProps } from '@bfc/extension';
import { getVirtualLG } from '@bfc/indexers/lib/dialogUtils/virtualDialog';

export interface LgWidgetProps extends WidgetContainerProps {
  /** indicates which field contains lg activity. ('activity', 'prompt', 'invalidPropmt'...) */
  field: string;
  defaultContent?: string;
}

export const LgWidget: React.FC<LgWidgetProps> = ({ data, field, defaultContent }) => {
  // console.log(data, field);
  const templateText = getVirtualLG(data, field);
  // const templateText = data[field];
  const displayedText = templateText || defaultContent;
  return <>{displayedText}</>;
};
