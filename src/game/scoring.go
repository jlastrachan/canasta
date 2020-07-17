package game

import (
	"github.com/jlastrachan/canasta/src/models/deck"
	"github.com/jlastrachan/canasta/src/models/player_hand"
)

var scores = map[deck.CardRank]int{
	deck.Four:  5,
	deck.Five:  5,
	deck.Six:   5,
	deck.Seven: 5,
	deck.Eight: 10,
	deck.Nine:  10,
	deck.Ten:   10,
	deck.Jack:  10,
	deck.Queen: 10,
	deck.King:  10,
	deck.Two:   20,
	deck.Ace:   20,
	deck.Joker: 50,
}

// ScoreCards Returns the score for a proposed group of cards for melding
func ScoreCards(meld []*deck.Card) int {
	totalScore := 0
	for _, card := range meld {
		if card.Rank == deck.Three {
			if card.IsRedThree() {
				totalScore += 100
			} else {
				totalScore += 5
			}
		} else {
			totalScore += scores[card.Rank]
		}
	}
	return totalScore
}

func ScoreForHand(ph *player_hand.PlayerHand, didUserGoOut bool) int {
	totalScore := 0

	if didUserGoOut {
		totalScore += 100
	}

	for meldRank, cards := range ph.Melds() {
		if meldRank == deck.Three && len(cards) == 4 {
			allRedThrees := true
			for _, c := range cards {
				if !c.IsRedThree() {
					allRedThrees = false
				}
			}
			// If has all 4 red threes, get an extra 400 points
			if allRedThrees {
				totalScore += 400
			}
		}

		if len(cards) >= 7 {
			totalScore += 300
			hasWildCard := false
			for _, card := range cards {
				if card.Rank != meldRank {
					hasWildCard = true
					break
				}
			}
			if !hasWildCard {
				totalScore += 200
			}
		}

		totalScore += ScoreCards(cards)
	}

	// Subtract cards in hand
	totalScore -= ScoreCards(ph.Hand())
	return totalScore
}
