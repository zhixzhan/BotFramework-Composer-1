// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { FieldProps } from '@bfc/extension';
import { FieldLabel } from '@bfc/adaptive-form';
import formatMessage from 'format-message';

import { LuisIntentEditor } from './LuisIntentEditor';

const VirtualLUField: React.FC<FieldProps> = props => {
  const { id, description, uiOptions, value, required, onChange } = props;

  const intentName = value.name;
  const handleChange = data => {
    const newValue = { ...value, body: data };
    onChange(newValue);
  };
  const label = formatMessage('Trigger phrases (intent: #{intentName})', { intentName });

  return (
    <React.Fragment>
      <FieldLabel id={id} label={label} description={description} helpLink={uiOptions?.helpLink} required={required} />
      <LuisIntentEditor {...props} onChange={handleChange}></LuisIntentEditor>
    </React.Fragment>
  );
};

export { VirtualLUField };
