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
	FreshCards  []*Card `json:"cards"`
	DiscardPile []*Card
}

type Card struct {
	ID   uuid.UUID `json:"id"`
	Suit CardSuit  `json:"suit"`
	Rank CardRank  `json:"rank"`
}

func GetDeck(numDecks int) *Deck {
	deck := &Deck{
		FreshCards:  []*Card{},
		DiscardPile: []*Card{},
	}

	for d := 0; d < numDecks; d++ {

		for _, rank := range suitedCardRanks {
			for _, suit := range allSuites {
				deck.FreshCards = append(deck.FreshCards, &Card{
					ID:   uuid.New(),
					Suit: suit,
					Rank: rank,
				})
			}
		}

		deck.FreshCards = append(deck.FreshCards, &Card{
			ID:   uuid.New(),
			Suit: Clubs,
			Rank: Joker,
		})

		deck.FreshCards = append(deck.FreshCards, &Card{
			ID:   uuid.New(),
			Suit: Hearts,
			Rank: Joker,
		})
	}

	for i := 0; i < 3; i++ {
		// Shuffle the deck 3 times
		deck.Shuffle()
	}

	return deck
}

func (d *Deck) Shuffle() {
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(d.FreshCards), func(i, j int) { d.FreshCards[i], d.FreshCards[j] = d.FreshCards[j], d.FreshCards[i] })
}

func (d *Deck) PopCard() *Card {
	var card *Card
	card, d.FreshCards = d.FreshCards[0], d.FreshCards[1:]
	return card
}

func (d *Deck) Discard(c *Card) {
	d.DiscardPile = append([]*Card{c}, d.DiscardPile...)
}

func (d *Deck) PopDiscardPile() []*Card {
	discard := d.DiscardPile
	d.DiscardPile = []*Card{}
	return discard
}

func (d *Deck) GetDiscard() []*Card {
	return d.DiscardPile
}

func (d *Deck) IsDiscardFrozen() bool {
	for _, c := range d.DiscardPile {
		if c.IsWildCard() {
			return true
		}
	}
	return false
}

//
// Card helpers
//

func (c *Card) IsBlackThree() bool {
	return c.Rank == Three && (c.Suit == Clubs || c.Suit == Spades)
}

func (c *Card) IsRedThree() bool {
	return c.Rank == Three && (c.Suit == Hearts || c.Suit == Diamonds)
}

func (c *Card) IsWildCard() bool {
	return c.Rank == Joker || c.Rank == Two
}
