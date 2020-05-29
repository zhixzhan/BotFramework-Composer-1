/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PluginConfig } from '@bfc/extension';
import { SDKKinds } from '@bfc/shared';
import formatMessage from 'format-message';

import { LuisIntentEditor } from './LuisIntentEditor';
import { RegexIntentField } from './RegexIntentField';
import { IntentField } from './IntentField';

const config: PluginConfig = {
  formSchema: {
    [SDKKinds.OnIntent]: {
      label: () => formatMessage('Intent recognized vir'),
      order: ['_virtual_lu', 'condition', 'entities', '*'],
      hidden: ['actions', 'intent'],
      // properties: {
      //   _virtual_lu: {
      //     label: () => formatMessage('Trigger phrases (intent: '),
      //     // field: LuisIntentEditor,
      //     // order: ['body'],
      //     // hidden: ['name'],
      //     // properties: {
      //     //   body: {
      //     //     // label: 'intent vir',
      //     //     field: LuisIntentEditor,
      //     //   },
      //     // },
      //   },
      // },
    },
    [SDKKinds.VirtualLU]: {
      field: IntentField,
    },
  },
  recognizers: [
    {
      id: SDKKinds.LuisRecognizer,
      displayName: 'LUIS',
      editor: LuisIntentEditor,
      isSelected: data => {
        return typeof data === 'string' && data.endsWith('.lu');
      },
      handleRecognizerChange: (props, shellData) => {
        const { luFiles, currentDialog, locale } = shellData;
        const luFile = luFiles.find(f => f.id === `${currentDialog.id}.${locale}`);
        if (luFile) {
          // strip locale out of id so it doesn't get serialized
          // into the .dialog file
          props.onChange(`${luFile.id.split('.')[0]}.lu`);
        } else {
          alert(`NO LU FILE WITH NAME ${currentDialog.id}`);
        }
      },
    },
    {
      id: SDKKinds.RegexRecognizer,
      displayName: () => formatMessage('Regular Expression'),
      editor: RegexIntentField,
      isSelected: data => {
        return typeof data === 'object' && data.$kind === SDKKinds.RegexRecognizer;
      },
      handleRecognizerChange: props => {
        props.onChange({ $kind: SDKKinds.RegexRecognizer, intents: [] });
      },
    },
  ],
};

export default config;
