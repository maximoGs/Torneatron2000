/**
 * Torneatron 2000 - Round Robin (Berger Tables) Pairing Engine
 * Generates full schedule where every participant plays everyone once with balanced home/away (White/Black).
 */

export const RoundRobinEngine = {
  /**
   * Generates all rounds upfront for Round Robin tournament
   */
  generateAllRounds(tournament) {
    const players = [...tournament.players.filter(p => p.active !== false)];
    const n = players.length;
    const isOdd = n % 2 !== 0;

    const list = [...players];
    if (isOdd) {
      list.push({ id: 'BYE_DUMMY', name: 'BYE', isDummy: true });
    }

    const totalRounds = list.length - 1;
    const half = list.length / 2;
    const rounds = [];

    // Berger Circle Algorithm
    for (let r = 0; r < totalRounds; r++) {
      const roundPairings = [];
      let byePlayerId = null;

      for (let i = 0; i < half; i++) {
        const p1 = list[i];
        const p2 = list[list.length - 1 - i];

        if (p1.isDummy) {
          byePlayerId = p2.id;
        } else if (p2.isDummy) {
          byePlayerId = p1.id;
        } else {
          // Alternate white and black based on round and position
          const isWhiteFirst = (i === 0 && r % 2 === 1) ? false : (i % 2 === 0);
          const white = isWhiteFirst ? p1 : p2;
          const black = isWhiteFirst ? p2 : p1;

          roundPairings.push({
            id: `r${r + 1}_m${roundPairings.length + 1}`,
            board: roundPairings.length + 1,
            whiteId: white.id,
            blackId: black.id,
            result: null
          });
        }
      }

      rounds.push({
        roundNumber: r + 1,
        status: r === 0 ? 'in_progress' : 'pending',
        pairings: roundPairings,
        byePlayerId: byePlayerId
      });

      // Rotate list keeping first fixed
      const fixed = list[0];
      const rest = list.slice(1);
      const last = rest.pop();
      rest.unshift(last);
      list.splice(0, list.length, fixed, ...rest);
    }

    return rounds;
  }
};
