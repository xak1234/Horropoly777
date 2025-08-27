// Simplified turn logic for Horropoly
// This module demonstrates core turn behaviour in a condensed form.

export function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return [die1, die2];
}

// Determine the first player by rolling dice for everyone.
// Re-roll when multiple players tie for the highest value.
export function determineTurnOrder(players, diceFn = rollDice) {
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error('No players provided');
  }

  let winners = [];
  let best = 0;

  // continue rolling until exactly one player wins
  while (winners.length !== 1) {
    winners = [];
    best = 0;

    for (const player of players) {
      const [d1, d2] = diceFn();
      const total = d1 + d2;
      player.lastRoll = total;
      if (total > best) {
        best = total;
        winners = [player];
      } else if (total === best) {
        winners.push(player);
      }
    }
  }

  return players.indexOf(winners[0]);
}

// Move a player's token around the board
export function movePlayer(player, spaces, board) {
  player.position = (player.position + spaces) % board.length;
}

function playerOwnsSet(player, setName, board) {
  const setTiles = board.filter(t => t.set === setName);
  return setTiles.filter(t => t.owner === player.id).length >= 3;
}

// Handle a player's single turn. Doubles grant another turn.
export async function takePlayerTurn(player, board, diceFn = rollDice, promptFn = () => true) {
  const [d1, d2] = diceFn();
  const total = d1 + d2;
  movePlayer(player, total, board);
  const tile = board[player.position];

  if (tile.type === 'property') {
    if (!tile.owner) {
      if (await promptFn(`Buy ${tile.name} for £${tile.cost}?`)) {
        tile.owner = player.id;
        player.money -= tile.cost;
      }
    } else if (tile.owner !== player.id) {
      const owner = board.players.find(p => p.id === tile.owner);
      if (owner) {
        player.money -= tile.rent;
        owner.money += tile.rent;
      }
    } else if (playerOwnsSet(player, tile.set, board)) {
      if (await promptFn(`Develop ${tile.name}?`)) {
        tile.developed = true;
      }
    }
  }

  if (d1 === d2) {
    await takePlayerTurn(player, board, diceFn, promptFn);
  }
}
