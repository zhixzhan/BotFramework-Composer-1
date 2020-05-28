// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { FieldProps } from '@bfc/extension';

import { LuisIntentEditor } from './LuisIntentEditor';

const VirtualLUField: React.FC<FieldProps> = props => {
  const { value, onChange } = props;

  const handleChange = data => {
    const newValue = { ...value, body: data };
    console.log(newValue);
    onChange(newValue);
  };

  return <LuisIntentEditor {...props} onChange={handleChange}></LuisIntentEditor>;
};

export { VirtualLUField };
