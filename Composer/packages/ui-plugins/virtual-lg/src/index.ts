/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PluginConfig } from '@bfc/extension';

import formSchema from './formSchema/index';
import flowSchema from './flowSchema';

const config: PluginConfig = {
  formSchema: formSchema,
  visualSchema: flowSchema,
};

export default config;
