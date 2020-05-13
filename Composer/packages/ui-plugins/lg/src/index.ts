// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PluginConfig } from '@bfc/extension';
import { SDKKinds } from '@bfc/shared';
import { VisualEditorColors as Colors } from '@bfc/ui-shared';

// import { LgField } from './LgField';
import { LgVirtualField } from './LgVirtualField';
import { LgWidget, LgVirtualWidget } from './LgWidget';

const config: PluginConfig = {
  formSchema: {
    [SDKKinds.SendActivity]: {
      properties: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        _virtual_activity: {
          label: 'Language Generation vir',
          description:
            'What your bot says to the user. This is a template used to create the outgoing message. It can include language generation rules, properties from memory, and other features.\n\nFor example, to define variations that will be chosen at random, write:\n- hello\n- hi',
          helpLink: 'https://aka.ms/lg-file-format',
        },
      },
    },
    [SDKKinds.IActivityVirtualTemplate]: {
      field: LgVirtualField,
    },
  },
  visualSchema: {
    widgets: {
      LgWidget: LgWidget,
      LgVirtualWidget: LgVirtualWidget,
    },
    schema: {
      [SDKKinds.SendActivity]: {
        widget: 'ActionCard',
        header: {
          widget: 'ActionHeader',
          icon: 'MessageBot',
          colors: {
            theme: Colors.BlueMagenta20,
            icon: Colors.BlueMagenta30,
          },
        },
        body: {
          widget: 'LgVirtualWidget',
          field: '_virtual_activity',
        },
      },
    },
  },
};

export default config;
