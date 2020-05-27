/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SDKKinds } from '@bfc/shared';
import { VisualEditorColors as Colors } from '@bfc/ui-shared';

import { LgWidget } from './LgWidget';

const SendActivity = {
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
    widget: 'LgWidget',
    field: 'activity',
  },
};

const flowSchema = {
  widgets: {
    LgWidget: LgWidget,
  },
  schema: {
    [SDKKinds.SendActivity]: SendActivity,
  },
};

export default flowSchema;
