/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { UISchema } from '@bfc/extension';
import { SDKKinds } from '@bfc/shared';

import { LgField } from './LgField';

const formSchema: UISchema = {
  [SDKKinds.SendActivity]: {
    order: ['_virtual_lg', '*'],
    hidden: ['activity'],
    properties: {
      _virtual_lg: {
        order: ['activity', '*'],
        properties: {
          activity: {
            label: 'Language Generation vir',
            description:
              'What your bot says to the user. This is a template used to create the outgoing message. It can include language generation rules, properties from memory, and other features.\n\nFor example, to define variations that will be chosen at random, write:\n- hello\n- hi',
            helpLink: 'https://aka.ms/lg-file-format',
          },
        },
      },
    },
  },
  [SDKKinds.IActivityTemplate]: {
    field: LgField,
  },
};

export default formSchema;
