// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IJSONChangeUpdate } from '../../src/jsonDiff/types';
import { deconstructUpdates } from '../../src/jsonDiff/deconstructUpdates';

describe('list diff deconstruct changes not at leaf node', () => {
  it('should deconstruct changes, both are leaf node', () => {
    const changes1: IJSONChangeUpdate[] = [
      {
        path: '[0].name',
        preValue: 'a',
        value: 'x',
      },
    ];

    const dechanges1 = deconstructUpdates(changes1);
    expect(dechanges1.updates.length).toEqual(1);
    expect(dechanges1.updates).toEqual(changes1);
    expect(dechanges1.adds.length).toEqual(0);
    expect(dechanges1.deletes.length).toEqual(0);
  });

  it('should deconstruct changes, both are not leaf node', () => {
    const changes2: IJSONChangeUpdate[] = [
      {
        path: '[0]',
        preValue: {
          id: 1,
          name: 'a',
        },
        value: {
          id: 1,
          name: 'x', // name change from 'a' -> 'x'
        },
      },
      {
        path: '[1]',
        preValue: {
          id: 2,
          name: 'b',
        },
        value: {
          id: 2,
          name: 'x', // name change from 'b' -> 'x'
        },
      },
    ];

    const dechanges2 = deconstructUpdates(changes2);
    expect(dechanges2.adds.length).toEqual(0);
    expect(dechanges2.deletes.length).toEqual(0);
    expect(dechanges2.updates.length).toEqual(2);
    expect(dechanges2.updates[0].path).toEqual('[0].name');
    expect(dechanges2.updates[0].preValue).toEqual('a');
    expect(dechanges2.updates[0].value).toEqual('x');
    expect(dechanges2.updates[1].path).toEqual('[1].name');
    expect(dechanges2.updates[1].preValue).toEqual('b');
    expect(dechanges2.updates[1].value).toEqual('x');
  });

  it('should deconstruct changes, leaf change is delete', () => {
    const changes3: IJSONChangeUpdate[] = [
      {
        path: '[0]',
        preValue: {
          id: 1,
          name: 'a', // deleted
        },
        value: {
          id: 1,
        },
      },
    ];

    const dechanges3 = deconstructUpdates(changes3);
    expect(dechanges3.updates.length).toEqual(0);
    expect(dechanges3.adds.length).toEqual(0);
    expect(dechanges3.deletes.length).toEqual(1);
    expect(dechanges3.deletes[0].path).toEqual('[0].name');
  });
  it('should deconstruct changes, leaf change is update & add', () => {
    const changes4: IJSONChangeUpdate[] = [
      {
        path: '[0]',
        preValue: {
          id: 1,
          name: 'a', // updated
        },
        value: {
          id: 1,
          name: 'x',
          desc: 'ha', // add
        },
      },
    ];

    const dechanges4 = deconstructUpdates(changes4);
    expect(dechanges4.updates.length).toEqual(1);
    expect(dechanges4.adds.length).toEqual(1);
    expect(dechanges4.deletes.length).toEqual(0);
    expect(dechanges4.updates[0].path).toEqual('[0].name');
    expect(dechanges4.updates[0].preValue).toEqual('a');
    expect(dechanges4.updates[0].value).toEqual('x');
    expect(dechanges4.adds[0].path).toEqual('[0].desc');
    expect(dechanges4.adds[0].value).toEqual('ha');
  });
  it('should deconstruct changes, one is object, one is string', () => {
    const changes5: IJSONChangeUpdate[] = [
      {
        path: '[0]',
        preValue: {
          id: 1,
          name: 'a',
        },
        value: 'x',
      },
    ];

    const dechanges5 = deconstructUpdates(changes5);
    expect(dechanges5.updates.length).toEqual(1);
    expect(dechanges5.adds.length).toEqual(0);
    expect(dechanges5.deletes.length).toEqual(0);
    expect(dechanges5.updates).toEqual(changes5);
  });
});
