package deck

import (
	"github.com/google/uuid"
	"math/rand"
	"time"
)

type CardSuit string

const (
	Hearts   CardSuit = "Hearts"
	Spades            = "Spades"
	Clubs             = "Clubs"
	Diamonds          = "Diamonds"
	NoSuit            = "NoSuit"
)

var allSuites = []CardSuit{Hearts, Spades, Clubs, Diamonds}

type CardRank string

const (
	Ace   CardRank = "Ace"
	Two            = "2"
	Three          = "3"
	Four           = "4"
	Five           = "5"
	Six            = "6"
	Seven          = "7"
	Eight          = "8"
	Nine           = "9"
	Ten            = "10"
	Jack           = "Jack"
	Queen          = "Queen"
	King           = "King"
	Joker          = "Joker"
)

var suitedCardRanks = []CardRank{Ace, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Jack, Queen, King}

type Deck struct {
	Cards []*Card `json:"cards"`
}

type Card struct {
	ID   uuid.UUID `json:"id"`
	Suit CardSuit  `json:"suit"`
	Rank CardRank  `json:"rank"`
}

func GetDeck(numDecks int) *Deck {
	deck := &Deck{
		Cards: []*Card{},
	}

	for d := 0; d < numDecks; d++ {

		for _, rank := range suitedCardRanks {
			for _, suit := range allSuites {
				deck.Cards = append(deck.Cards, &Card{
					ID:   uuid.New(),
					Suit: suit,
					Rank: rank,
				})
			}
		}

		deck.Cards = append(deck.Cards, &Card{
			ID:   uuid.New(),
			Suit: Clubs,
			Rank: Joker,
		})

		deck.Cards = append(deck.Cards, &Card{
			ID:   uuid.New(),
			Suit: Hearts,
			Rank: Joker,
		})
	}

	deck.Shuffle()
	return deck
}

func (d *Deck) Shuffle() {
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(d.Cards), func(i, j int) { d.Cards[i], d.Cards[j] = d.Cards[j], d.Cards[i] })
}

func (d *Deck) PopCard() *Card {
	var card *Card
	card, d.Cards = d.Cards[0], d.Cards[1:]
	return card
}

func (c *Card) IsBlackThree() bool {
	return c.Rank == Three && (c.Suit == Clubs || c.Suit == Spades)
}

func (c *Card) IsWildCard() bool {
	return c.Rank == Joker || c.Rank == Two
}
