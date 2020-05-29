// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { FieldProps, useShellApi } from '@bfc/extension';
import { DialogInfo, SDKKinds } from '@bfc/shared';
import { FieldLabel, usePluginConfig } from '@bfc/adaptive-form';
import formatMessage from 'format-message';

// TODO: extend recognizer config to support this
export function recognizerType({ content }: DialogInfo): string | null {
  const { recognizer } = content;

  if (recognizer) {
    if (typeof recognizer === 'object' && recognizer.$kind === SDKKinds.RegexRecognizer) {
      return SDKKinds.RegexRecognizer;
    } else if (typeof recognizer === 'string') {
      return SDKKinds.LuisRecognizer;
    }
  }

  return null;
}

const IntentField: React.FC<FieldProps> = props => {
  const { id, description, uiOptions, value, required, onChange } = props;
  const { currentDialog } = useShellApi();
  const { recognizers } = usePluginConfig();
  const type = recognizerType(currentDialog);

  const intent = value;

  const handleChange = data => {
    const newValue = { ...value, body: data };
    onChange(newValue);
  };

  const Editor = recognizers.find(r => r.id === type)?.editor;
  const label = formatMessage('Trigger phrases (intent: #{intentName})', { intentName: intent.name });

  return (
    <React.Fragment>
      <FieldLabel id={id} label={label} description={description} helpLink={uiOptions?.helpLink} required={required} />
      {Editor ? <Editor {...props} value={intent.body} onChange={handleChange} /> : `No Editor for ${type}`}
    </React.Fragment>
  );
};

export { IntentField };
