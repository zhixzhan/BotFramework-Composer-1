// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import { JsonDiff, defaultJSONComparator, defualtJSONStopComparison } from '../../src/jsonDiff';
import { IComparator } from '../../src/jsonDiff/types';
import { getWithJsonPath, hasWithJsonPath, JsonSet, JsonInsert } from '../../src/jsonDiff/helper';

describe('json diff test sample object', () => {
  it('get all changes on object value', () => {
    const lhs = {
      foo: {
        bar: {
          a: ['a', 'b'],
          b: 2,
          c: ['x', 'y'],
          e: 100, // deleted
        },
      },
      buzz: 'world',
    };

    const rhs = {
      foo: {
        bar: {
          a: ['a'], // index 1 ('b')  deleted
          b: 2, // unchanged
          c: ['x', { cc: 2 }, 'z'], // 'z' added, 'y' updated
          d: 'Hello, world!', // added
        },
      },
      buzz: 'fizz', // updated
    };
    const changes = JsonDiff(lhs, rhs);
    expect(changes.adds.length).toEqual(2);
    expect(changes.adds[0].path).toEqual('$.foo.bar.c[2]');
    expect(changes.adds[0].value).toEqual('z');
    expect(changes.adds[1].path).toEqual('$.foo.bar.d');
    expect(changes.adds[1].value).toEqual('Hello, world!');

    expect(changes.deletes.length).toEqual(2);
    expect(changes.deletes[0].path).toEqual('$.foo.bar.a[1]');
    expect(changes.deletes[0].value).toEqual('b');
    expect(changes.deletes[1].path).toEqual('$.foo.bar.e');
    expect(changes.deletes[1].value).toEqual(100);

    expect(changes.updates.length).toEqual(2);
    expect(changes.updates[0].path).toEqual('$.foo.bar.c[1]');
    expect(changes.updates[0].preValue).toEqual('y');
    expect(changes.updates[0].value).toEqual({ cc: 2 });
    expect(changes.updates[1].path).toEqual('$.buzz');
    expect(changes.updates[1].preValue).toEqual('world');
    expect(changes.updates[1].value).toEqual('fizz');
  });
});

describe('json diff test complicapte object', () => {
  it('get all changes on array value', () => {
    const lhs2 = {
      foo: {
        bar: {
          a: ['a', 'b'],
          b: 2,
          c: [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 3, name: 'c' },
          ],
          d: [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 3, name: 'c' },
          ],
          f: [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 3, name: 'c' },
          ],
        },
      },
      buzz: 'world',
    };

    const rhs2 = {
      foo: {
        bar: {
          a: ['a', 'b'],
          b: 2,
          c: [
            { id: 0, name: 'a' }, // insert
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
            { id: 3, name: 'c' },
          ],
          d: [
            { id: 1, name: 'a' },
            // { id: 2, name: 'b' },  // delete
            { id: 3, name: 'c' },
          ],
          f: [
            { id: 1, name: 'a' },
            { id: 2, name: 'bb' }, // update
            { id: 3, name: 'c' },
          ],
        },
      },
      buzz: 'world',
    };
    const changes = JsonDiff(lhs2, rhs2);
    expect(changes.adds.length).toEqual(1);
    expect(changes.adds[0].path).toEqual('$.foo.bar.c[0]');
    expect(changes.adds[0].value).toEqual(rhs2.foo.bar.c[0]);

    expect(changes.deletes.length).toEqual(1);
    expect(changes.deletes[0].path).toEqual('$.foo.bar.d[1]');

    expect(changes.updates.length).toEqual(1);
    expect(changes.updates[0].path).toEqual('$.foo.bar.f[1].name');
    expect(changes.updates[0].value).toEqual(rhs2.foo.bar.f[1].name);
    expect(changes.updates[0].preValue).toEqual(lhs2.foo.bar.f[1].name);
  });
});

describe('json diff test deep nested object', () => {
  const basic = {
    foo: {
      bar: [
        {
          id: 1,
          name: 'a',
          items: [
            {
              id: 11,
              name: 'a1',
            },
            {
              id: 12,
              name: 'a2',
            },
          ],
        },
      ],
    },
    buzz: 'world',
  };

  const insert1 = [
    {
      path: 'foo.bar[0].items[0]',
      value: {
        id: 10,
        name: 'a0',
      },
    },
  ];
  it('get all add changes', () => {
    const object1 = JsonInsert(basic, insert1);
    const changes1 = JsonDiff(basic, object1);
    expect(changes1.adds.length).toEqual(1);
    expect(changes1.deletes.length).toEqual(0);
    expect(changes1.updates.length).toEqual(0);
    expect(changes1.adds[0].path).toEqual(`$.${insert1[0].path}`);
    expect(changes1.adds[0].value).toEqual(insert1[0].value);
  });
  it('get all update changes', () => {
    const object2 = JsonSet(basic, insert1);
    const changes2 = JsonDiff(basic, object2);
    expect(changes2.adds.length).toEqual(0);
    expect(changes2.deletes.length).toEqual(0);
    expect(changes2.updates.length).toEqual(2);
    expect(changes2.updates[0].path).toEqual(`$.${insert1[0].path}.id`);
    expect(changes2.updates[1].path).toEqual(`$.${insert1[0].path}.name`);
  });
});

describe('json diff with customize comparator', () => {
  // A customize comparator, if two object has same id, they are same.
  const myComparator: IComparator = (json1: any, json2: any, path: string) => {
    if (hasWithJsonPath(json1, `${path}.id`) && hasWithJsonPath(json2, `${path}.id`)) {
      const isChange = !isEqual(getWithJsonPath(json1, `${path}.id`), getWithJsonPath(json2, `${path}.id`));
      const isAdd = !hasWithJsonPath(json1, path) && hasWithJsonPath(json1, path);
      const isStop = isChange || defualtJSONStopComparison(json1, json2, path);
      return { isChange, isAdd, isStop };
    } else {
      return defaultJSONComparator(json1, json2, path);
    }
  };
  const basic = {
    foo: {
      bar: {
        a: ['a', 'b'],
        b: 2,
        c: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        d: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
        f: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          { id: 3, name: 'c' },
        ],
      },
    },
    buzz: 'world',
  };
  it('should not be counted as a change if id is same', () => {
    const insert1 = [
      {
        path: 'foo.bar.c[0]',
        value: { id: 11, name: 'x' },
      },
      {
        path: 'foo.bar.d[1]',
        value: { id: 11, name: 'x' },
      },
    ];
    const list1 = JsonInsert(basic, insert1);
    const changes1 = JsonDiff(basic, list1);
    expect(changes1.adds.length).toEqual(2);
    expect(changes1.deletes.length).toEqual(0);
    expect(changes1.updates.length).toEqual(0);
    expect(changes1.adds[0].path).toEqual(`$.${insert1[0].path}`);
    expect(changes1.adds[0].value).toEqual(insert1[0].value);
    expect(changes1.adds[1].path).toEqual(`$.${insert1[1].path}`);
    expect(changes1.adds[1].value).toEqual(insert1[1].value);
  });
  it('should be counted as a change if id is diffrent', () => {
    const insert2 = [
      {
        path: 'foo.bar.c[1]',
        value: { id: 22, name: 'xbb' }, // id updated, count as a change
      },
      {
        path: 'foo.bar.c[0]',
        value: { id: 1, name: 'x' }, // id not updated, not count as a change
      },
    ];
    const list2 = JsonSet(basic, insert2);
    const changes2 = JsonDiff(basic, list2, myComparator);
    expect(changes2.adds.length).toEqual(0);
    expect(changes2.deletes.length).toEqual(0);
    expect(changes2.updates.length).toEqual(1);
    expect(changes2.updates[0].path).toEqual(`$.${insert2[0].path}`);
    expect(changes2.updates[0].preValue).toEqual(get(basic, insert2[0].path));
    expect(changes2.updates[0].value).toEqual(insert2[0].value);
  });
});
