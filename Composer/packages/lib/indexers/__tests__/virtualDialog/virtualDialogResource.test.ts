/* eslint-disable @typescript-eslint/camelcase */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { VirtualLGPropName, VirtualLUPropName } from '../../src/virtualDialog/constants';
import { VirtualDialogResource } from '../../src/virtualDialog';

describe('Rsources in virtual dialog', () => {
  it('should find LG resource in virtual dialog', () => {
    const virtualDialog = {
      $kind: 'Microsoft.AdaptiveDialog',
      $designer: {
        id: '6uQuGV',
        name: 'm7',
        description: '',
      },
      autoEndDialog: true,
      defaultResultProperty: 'dialog.result',
      triggers: [
        {
          $kind: 'Microsoft.OnBeginDialog',
          $designer: {
            name: 'BeginDialog',
            description: '',
            id: 'Sdvm07',
          },
          actions: [
            {
              $kind: 'Microsoft.SendActivity',
              $designer: {
                id: 'WezpV5',
              },
              activity: '${SendActivity_c7Wg7i()}',
              [VirtualLGPropName]: {
                activity: '- hello',
              },
            },
          ],
        },
      ],
      generator: 'm7.lg',
    };

    const resources = VirtualDialogResource(virtualDialog);
    expect(resources.lg.length).toEqual(1);
    expect(resources.lg[0]).toEqual({ name: 'SendActivity_WezpV5', body: '- hello', parameters: [] });
    expect(resources.lu.length).toEqual(0);
  });
  it('should find LU resource in virtual dialog', () => {
    const virtualDialog = {
      $kind: 'Microsoft.AdaptiveDialog',
      $designer: {
        id: '6uQuGV',
        name: 'm7',
        description: '',
      },
      autoEndDialog: true,
      defaultResultProperty: 'dialog.result',
      triggers: [
        {
          $kind: 'Microsoft.OnIntent',
          $designer: {
            id: '6L3t6X',
          },
          intent: 'hello',
          actions: [
            {
              $kind: 'Microsoft.SendActivity',
              $designer: {
                id: 'kbvD42',
              },
              activity: '${SendActivity_kbvD42()}',
              [VirtualLGPropName]: {
                activity: '- hello',
              },
            },
          ],
          [VirtualLUPropName]: {
            name: 'hello',
            body: '- halo',
          },
        },
      ],
      generator: 'm7.lg',
      recognizer: 'm7.lu',
    };

    const resources = VirtualDialogResource(virtualDialog);
    expect(resources.lg.length).toEqual(1);
    expect(resources.lg[0]).toEqual({ name: 'SendActivity_kbvD42', body: '- hello', parameters: [] });
    expect(resources.lu.length).toEqual(1);
    expect(resources.lu[0]).toEqual({ Name: 'hello', Body: '- halo' });
  });
});
