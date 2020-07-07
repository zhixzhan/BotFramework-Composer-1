// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SDKKinds } from '@bfc/shared';

export const VirtualLGPropName = '_virtual_lg';
export const VirtualLUPropName = '_virtual_lu';
export const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity']; // fields may contains lg
export const LUIntentFields = ['intent']; // fields may contains lu
export const LUSDKKinds = [
  SDKKinds.OnIntent,
  SDKKinds.ConfirmInput,
  SDKKinds.AttachmentInput,
  SDKKinds.ChoiceInput,
  SDKKinds.ConfirmInput,
  SDKKinds.DateTimeInput,
  SDKKinds.NumberInput,
  SDKKinds.TextInput,
];

export const VirtualLG = {
  title: 'Virtual LG',
  description: '',
  $role: 'interface',
  type: 'object',
};

export const VirtualLU = {
  title: 'Virtual LU',
  description: '',
  $role: 'interface',
  type: 'object',
};
