/*
 * ========================================================
 * ========================================================
 * ========================================================
 * ========================================================
 *
 *                  Card Deck Functions
 *
 * ========================================================
 * ========================================================
 * ========================================================
 */

// get a random index from an array given it's size
const getRandomIndex = function (size) {
  return Math.floor(Math.random() * size);
};

// cards is an array of card objects
const shuffleCards = function (cards) {
  let currentIndex = 0;

  // loop over the entire cards array
  while (currentIndex < cards.length) {
    // select a random position from the deck
    const randomIndex = getRandomIndex(cards.length);

    // get the current card in the loop
    const currentItem = cards[currentIndex];

    // get the random card
    const randomItem = cards[randomIndex];

    // swap the current card and the random card
    cards[currentIndex] = randomItem;
    cards[randomIndex] = currentItem;

    currentIndex += 1;
  }

  // give back the shuffled deck
  return cards;
};

const makeDeck = function () {
  // create the empty deck at the beginning
  const deck = [];

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

  let suitIndex = 0;
  while (suitIndex < suits.length) {
    // make a variable of the current suit
    const currentSuit = suits[suitIndex];

    // loop to create all cards in this suit
    // rank 1-13
    let rankCounter = 1;
    while (rankCounter <= 13) {
      let cardName = rankCounter;

      // 1, 11, 12 ,13
      if (cardName === 1) {
        cardName = 'ace';
      } else if (cardName === 11) {
        cardName = 'jack';
      } else if (cardName === 12) {
        cardName = 'queen';
      } else if (cardName === 13) {
        cardName = 'king';
      }

      // make a single card object variable
      const card = {
        name: cardName,
        suit: currentSuit,
        rank: rankCounter,
      };

      // add the card to the deck
      deck.push(card);

      rankCounter += 1;
    }
    suitIndex += 1;
  }

  return deck;
};
/* MINI- FN: SORT CARDS IN HAND AND REARRANGE THEM */
const sortRank = (hand) => { /* remb hand is an array */
  /* rearrange them from highest to lowest (b - a) */
  hand.sort((a, b) => parseFloat(b.rank) - parseFloat(a.rank));
  return hand;
};

/* COMPARE High Card of 2 hands and declare winner */
const checkWin = (prevHand, newHand) => {
  let outcome;
  /* sort each Hand, don't care if they are mutated since prevHand and newHand are aldy clones.  */
  const sortedPrevHand = sortRank(prevHand);
  const sortedNewHand = sortRank(newHand);

  /* compare highCard of each Hand against each other and */
  /* see which is bigger, f prev HIghCard is bigger than new High Card */
  if (sortedPrevHand[0].rank > sortedNewHand[0].rank) {
    outcome = 'win';
  } else if (sortedPrevHand[0].rank < sortedNewHand[0].rank) {
    outcome = 'lose';
  } else if (sortedPrevHand[0].rank === sortedNewHand[0].rank) {
    outcome = 'draw';
  } else {
    outcome = 'no comparisons yet';
  }
  return outcome;
};

/*
 * ========================================================
 * ========================================================
 * ========================================================
 * ========================================================
 *
 *                  Controller Functions
 *
 * ========================================================
 * ========================================================
 * ========================================================
 */

export default function initGamesController(db) {
  // render the main page
  const index = (request, response) => {
    response.render('games/index');
  };

  // create a new game. Insert a new row in the DB.
  const create = async (request, response) => {
    // deal out a new shuffled deck for this game.
    const cardDeck = shuffleCards(makeDeck());
    const playerHand = [cardDeck.pop(), cardDeck.pop()];

    const newGame = {
      gameState: {
        cardDeck,
        playerHand,
      },
    };

    try {
      // run the DB INSERT query
      const game = await db.Game.create(newGame);

      // send the new game back to the user.
      // dont include the deck so the user can't cheat
      response.send({
        id: game.id,
        playerHand: game.gameState.playerHand,
      });
    } catch (error) {
      response.status(500).send(error);
    }
  };

  // deal two new cards from the deck.
  const deal = async (request, response) => {
    try {
    // get the game by the ID passed in the request
      const game = await db.Game.findByPk(request.params.id);

      /* ES6 clone cards from current hand */
      const prevHand = Array.from(game.dataValues.gameState.playerHand);
      console.log('prevHand =', prevHand);

      // make changes to the object
      const playerHand = [game.gameState.cardDeck.pop(), game.gameState.cardDeck.pop()];

      // update the game with the new info
      await game.update({
        gameState: {
          cardDeck: game.gameState.cardDeck,
          playerHand,
        },
      });

      /* ES6 Clone Cards from New Hand */
      const newHand = Array.from(game.dataValues.gameState.playerHand);
      console.log('newHand =', newHand);
      const result = checkWin(prevHand, newHand);
      console.log('results =', result);
      // send the updated game back to the user.
      // dont include the deck so the user can't cheat
      response.send({
        id: game.id,
        playerHand: game.gameState.playerHand,
        outcome: result,
      });
    } catch (error) {
      response.status(500).send(error);
    }
  };

  // return all functions we define in an object
  // refer to the routes file above to see this used
  return {
    deal,
    create,
    index,
  };
}
