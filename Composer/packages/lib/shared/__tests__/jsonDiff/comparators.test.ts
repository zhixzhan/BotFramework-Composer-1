// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { defaultJSONComparator, defualtJSONStopComparison } from '../../src/jsonDiff';

describe('json diff check comparators', () => {
  it('defualtJSONStopComparison', () => {
    expect(defualtJSONStopComparison({}, { a: 1 }, '$')).toEqual(false);
    expect(defualtJSONStopComparison({}, [], '$')).toEqual(true);
    expect(defualtJSONStopComparison(1, { a: 1 }, '$')).toEqual(true);
    expect(defualtJSONStopComparison(1, 'a', '$')).toEqual(true);
  });

  it('defaultJSONComparator', () => {
    const result1 = defaultJSONComparator({}, { a: 1 }, '$');
    expect(result1.isChange).toEqual(true);
    expect(result1.isStop).toEqual(false);

    const result2 = defaultJSONComparator({}, { a: 1 }, '$.a');
    expect(result2.isChange).toEqual(false); // '$.a' is an `add` not `update`
    expect(result2.isStop).toEqual(true);
    expect(result2.isAdd).toEqual(true);

    const result3 = defaultJSONComparator({ a: 0, b: 2 }, { a: 1, b: [] }, '$.a');
    expect(result3.isChange).toEqual(true); // '$.a' update from 0 to 1
    expect(result3.isStop).toEqual(true);

    const result4 = defaultJSONComparator({ a: 0, b: 2 }, { a: 1, b: [] }, '$.b');
    expect(result4.isChange).toEqual(true); // '$.a' update from 2 to []
    expect(result4.isStop).toEqual(true);

    const result5 = defaultJSONComparator({ a: 0, b: 2 }, { a: 1, b: [] }, '$');
    expect(result5.isChange).toEqual(true);
    expect(result5.isStop).toEqual(false);

    const result6 = defaultJSONComparator([1, 2], { a: 1, b: [] }, '$');
    expect(result6.isChange).toEqual(true); // update on '$'
    expect(result6.isStop).toEqual(true);

    const result7 = defaultJSONComparator([1, 2], [1, 22, 3], '$.[1]');
    expect(result7.isChange).toEqual(true);
    expect(result7.isStop).toEqual(true);

    const result8 = defaultJSONComparator([1, 2], [1, 22, 3], '$.[0]');
    expect(result8.isChange).toEqual(false);
    expect(result8.isStop).toEqual(true);
  });
});
