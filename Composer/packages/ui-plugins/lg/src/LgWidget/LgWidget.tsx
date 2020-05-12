// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { WidgetContainerProps } from '@bfc/extension';
import { getVPropsByField } from '@bfc/indexers/lib/dialogUtils/dialogConverter';

import { normalizeLgTemplate } from './normalizeLgTemplate';

export interface LgWidgetProps extends WidgetContainerProps {
  /** indicates which field contains lg activity. ('activity', 'prompt', 'invalidPropmt'...) */
  field: string;
  defaultContent?: string;
}

export const LgWidget: React.FC<LgWidgetProps> = ({ data, field, defaultContent }) => {
  const templateText = getVPropsByField(data, field) || data[field] || '';
  const textNormalized = normalizeLgTemplate(templateText);
  const displayedText = textNormalized || defaultContent;
  return <>{displayedText}</>;
};
