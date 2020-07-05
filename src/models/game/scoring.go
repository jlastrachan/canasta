package game

import "github.com/jlastrachan/canasta/models/deck"

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

func ScoreMeld(meld []*deck.Card) int {
	totalScore := 0
	for _, card := range meld {
		totalScore += scores[card.Rank]
	}
	return totalScore
}
