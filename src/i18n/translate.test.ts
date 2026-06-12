import { describe, expect, it } from 'vitest';

import { pluralUk, translate } from './translate';

const dict = {
  greeting: 'Hello',
  seats: 'The table seats {count}',
  missing: '',
};

describe('translate', () => {
  it('returns the string for a key', () => {
    expect(translate(dict, 'greeting')).toBe('Hello');
  });

  it('interpolates {params}', () => {
    expect(translate(dict, 'seats', { count: 5 })).toBe('The table seats 5');
  });

  it('falls back to the key itself when missing (so gaps are visible, never blank)', () => {
    expect(translate(dict, 'nope')).toBe('nope');
  });
});

describe('pluralUk', () => {
  it('picks one / few / many by Ukrainian rules', () => {
    expect(pluralUk(1, 'голос', 'голоси', 'голосів')).toBe('голос');
    expect(pluralUk(3, 'голос', 'голоси', 'голосів')).toBe('голоси');
    expect(pluralUk(5, 'голос', 'голоси', 'голосів')).toBe('голосів');
    expect(pluralUk(11, 'голос', 'голоси', 'голосів')).toBe('голосів');
    expect(pluralUk(22, 'голос', 'голоси', 'голосів')).toBe('голоси');
  });
});
