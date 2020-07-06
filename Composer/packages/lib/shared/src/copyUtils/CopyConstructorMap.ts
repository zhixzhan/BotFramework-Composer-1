// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SDKKinds } from '../types/schema';

import { copyIfCondition } from './copyIfCondition';
import { copySwitchCondition } from './copySwitchCondition';
import { shallowCopyAdaptiveAction } from './shallowCopyAdaptiveAction';
import { copyForeach } from './copyForeach';
import { copyEditActions } from './copyEditActions';

const CopyConstructorMap = {
  [SDKKinds.IfCondition]: copyIfCondition,
  [SDKKinds.SwitchCondition]: copySwitchCondition,
  [SDKKinds.Foreach]: copyForeach,
  [SDKKinds.ForeachPage]: copyForeach,
  [SDKKinds.EditActions]: copyEditActions,
  default: shallowCopyAdaptiveAction,
};

export default CopyConstructorMap;
