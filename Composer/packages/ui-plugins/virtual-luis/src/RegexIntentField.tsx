// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/** @jsx jsx */
import { jsx } from '@emotion/core';
import React from 'react';
import { FieldProps } from '@bfc/extension';
import { StringField } from '@bfc/adaptive-form';

const RegexIntentField: React.FC<FieldProps> = props => {
  return <StringField {...props} label={false} />;
};

export { RegexIntentField };
