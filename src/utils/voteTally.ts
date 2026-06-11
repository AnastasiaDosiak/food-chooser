export const countTotalVotes = (votesByOptionId: Record<string, number>): number =>
  Object.values(votesByOptionId).reduce((sum, count) => sum + count, 0);

/** R1.6: each option holds at most partySize votes; options are independent, so the board total may exceed it. */
export const castVote = (
  votesByOptionId: Record<string, number>,
  optionId: string,
  partySize: number,
): Record<string, number> => {
  const currentVotes = votesByOptionId[optionId] ?? 0;
  if (currentVotes >= partySize) {
    return votesByOptionId;
  }
  return { ...votesByOptionId, [optionId]: currentVotes + 1 };
};

export const withdrawVote = (
  votesByOptionId: Record<string, number>,
  optionId: string,
): Record<string, number> => {
  const currentVotes = votesByOptionId[optionId] ?? 0;
  if (currentVotes === 0) {
    return votesByOptionId;
  }
  return { ...votesByOptionId, [optionId]: currentVotes - 1 };
};
