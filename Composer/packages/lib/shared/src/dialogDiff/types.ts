// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { SDKKinds } from '../index';

export interface DialogObject {
  $kind: SDKKinds;
  $designer?: {
    id: string | number;
  };
}
