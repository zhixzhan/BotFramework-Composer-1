// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RecognizerSchema } from '@bfc/extension';
import formatMessage from 'format-message';

const DefaultRecognizers: RecognizerSchema[] = [
  {
    id: 'none',
    displayName: () => formatMessage('None'),
    isSelected: data => data === undefined,
    handleRecognizerChange: props => props.onChange(undefined),
  },
];

export default DefaultRecognizers;
