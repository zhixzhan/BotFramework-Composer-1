/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import get from 'lodash/get';
import { FieldProps } from '@bfc/extension';
import { SchemaField } from '@bfc/adaptive-form';

import { GetSchema } from './types';

const VirtualField: React.FC<FieldProps> = props => {
  const getSchema: GetSchema = field => {
    const fieldSchema = get(props.schema, ['properties', field]);
    return fieldSchema;
  };

  const getValue = field => {
    return get(props.value, field);
  };

  const getError = field => {
    if (typeof props.rawErrors === 'object') {
      return props.rawErrors[field];
    }
  };

  const updateField = field => data => {
    const newData = { ...props.value, [field]: data };
    props.onChange(newData);
  };

  const f = 'activity';

  return (
    <SchemaField
      key={f}
      definitions={props.definitions}
      depth={props.depth}
      id={`${props.id}.${f}`}
      name={f}
      rawErrors={getError(f)}
      schema={getSchema(f)}
      uiOptions={props.uiOptions.properties?.[f] || {}}
      value={getValue(f)}
      onChange={updateField(f)}
    />
  );
};

export { VirtualField };
