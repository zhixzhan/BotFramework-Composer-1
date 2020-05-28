// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import formatMessage from 'format-message';
import { Pivot, PivotLinkSize, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import get from 'lodash/get';
import { FieldProps, useShellApi } from '@bfc/extension';
import { SchemaField } from '@bfc/adaptive-form';
import { PromptTab } from '@bfc/shared';

import { tabs } from './styles';
import { BotAsks } from './BotAsks';
import { UserInput } from './UserInput';
import { GetSchema, PromptFieldChangeHandler, InputDialogKeys } from './types';

const VirtualLGPropName = '_virtual_lg';
const VirtualLUPropName = '_virtual_lu';

const LGTemplateFields = ['prompt', 'unrecognizedPrompt', 'invalidPrompt', 'defaultValueResponse', 'activity'];
const LUIntentFields = ['intent'];

const OTHER_FIELDS: InputDialogKeys[] = [
  'unrecognizedPrompt',
  'validations',
  'invalidPrompt',
  'defaultValueResponse',
  'maxTurnCount',
  'defaultValue',
  'allowInterruptions',
  'alwaysPrompt',
  'recognizerOptions',
];

const PromptField: React.FC<FieldProps> = props => {
  const { shellApi, focusedSteps, focusedTab } = useShellApi();

  const getSchema: GetSchema = field => {
    const fieldSchema = get(props.schema, ['properties', field]);

    return fieldSchema;
  };

  const getvalue = field => {
    let value;
    if (LGTemplateFields.includes(field)) {
      value = get(props.value, [VirtualLGPropName, field]);
    } else if (LUIntentFields.includes(field)) {
      value = get(props.value, [VirtualLUPropName, 'body']);
    } else {
      value = get(props.value, field);
    }
    return value;
  };

  const getError = field => {
    if (typeof props.rawErrors === 'object') {
      return props.rawErrors[field];
    }
  };

  const updateField: PromptFieldChangeHandler = field => data => {
    let newData = { ...props.value };
    if (LUIntentFields.includes(field)) {
      const newLUData = { ...newData[VirtualLUPropName], body: data };
      newData = { ...newData, [VirtualLUPropName]: newLUData };
    } else if (LGTemplateFields.includes(field)) {
      const newLGData = { ...newData[VirtualLGPropName], [field]: data };
      newData = { ...newData, [VirtualLGPropName]: newLGData };
    } else {
      newData = { ...newData, [field]: data };
    }
    props.onChange(newData);
  };

  const handleTabChange = (item?: PivotItem) => {
    if (item) {
      shellApi.onFocusSteps(focusedSteps, item.props.itemKey);
    }
  };

  return (
    <div>
      <Pivot linkSize={PivotLinkSize.large} selectedKey={focusedTab} styles={tabs} onLinkClick={handleTabChange}>
        <PivotItem headerText={formatMessage('Bot Asks')} itemKey={PromptTab.BOT_ASKS}>
          <BotAsks {...props} getValue={getvalue} getError={getError} getSchema={getSchema} onChange={updateField} />
        </PivotItem>
        <PivotItem headerText={formatMessage('User Input')} itemKey={PromptTab.USER_INPUT}>
          <UserInput {...props} getValue={getvalue} getError={getError} getSchema={getSchema} onChange={updateField} />
        </PivotItem>
        <PivotItem headerText={formatMessage('Other')} itemKey={PromptTab.OTHER}>
          {OTHER_FIELDS.filter(f => getSchema(f)).map(f => (
            <SchemaField
              key={f}
              definitions={props.definitions}
              depth={props.depth}
              id={`${props.id}.${f}`}
              name={f}
              rawErrors={getError(f)}
              schema={getSchema(f)}
              uiOptions={props.uiOptions.properties?.[f] || {}}
              value={getvalue(f)}
              onChange={updateField(f)}
            />
          ))}
        </PivotItem>
      </Pivot>
    </div>
  );
};

export { PromptField };
