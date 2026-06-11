import { describe, expect, it } from 'vitest';

import { castVote, countTotalVotes, withdrawVote } from './voteTally';

describe('countTotalVotes', () => {
  it('returns 0 for an empty ballot', () => {
    expect(countTotalVotes({})).toBe(0);
  });

  it('sums votes across all options', () => {
    expect(countTotalVotes({ burgers: 2, sushi: 1, pizza: 0 })).toBe(3);
  });
});

describe('castVote', () => {
  it('adds a vote to an option', () => {
    expect(castVote({}, 'burgers', 4)).toEqual({ burgers: 1 });
  });

  it('lets the whole party pile onto a single option', () => {
    let votesByOptionId: Record<string, number> = {};
    for (let voter = 0; voter < 3; voter += 1) {
      votesByOptionId = castVote(votesByOptionId, 'sushi', 3);
    }
    expect(votesByOptionId).toEqual({ sushi: 3 });
  });

  it('caps a single option at the party size', () => {
    const votesByOptionId = { sushi: 3 };
    expect(castVote(votesByOptionId, 'sushi', 3)).toBe(votesByOptionId);
  });

  it('keeps every other option open when one option is full', () => {
    expect(castVote({ sushi: 3 }, 'pizza', 3)).toEqual({ sushi: 3, pizza: 1 });
  });

  it('allows the board total to exceed the party size across options', () => {
    let votesByOptionId: Record<string, number> = { burgers: 3, sushi: 3 };
    votesByOptionId = castVote(votesByOptionId, 'pizza', 3);
    expect(votesByOptionId).toEqual({ burgers: 3, sushi: 3, pizza: 1 });
    expect(countTotalVotes(votesByOptionId)).toBe(7);
  });

  it('does not mutate the previous ballot', () => {
    const votesByOptionId = { burgers: 1 };
    castVote(votesByOptionId, 'burgers', 4);
    expect(votesByOptionId).toEqual({ burgers: 1 });
  });
});

describe('withdrawVote', () => {
  it('removes one vote from an option', () => {
    expect(withdrawVote({ burgers: 2 }, 'burgers')).toEqual({ burgers: 1 });
  });

  it('reopens a full option so a vote can be recast', () => {
    const fullOption = { sushi: 3 };
    const afterWithdraw = withdrawVote(fullOption, 'sushi');
    expect(afterWithdraw).toEqual({ sushi: 2 });
    expect(castVote(afterWithdraw, 'sushi', 3)).toEqual({ sushi: 3 });
  });

  it('ignores withdrawing from an option with no votes', () => {
    const votesByOptionId = { burgers: 1, sushi: 0 };
    expect(withdrawVote(votesByOptionId, 'sushi')).toBe(votesByOptionId);
  });
});
