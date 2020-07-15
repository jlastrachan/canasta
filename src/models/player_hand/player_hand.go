package player_hand

import (
	"errors"
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/deck"
)

type PlayerHand struct {
	hand  map[uuid.UUID]*deck.Card
	melds map[deck.CardRank][]*deck.Card
}

func CreateHand() *PlayerHand {
	return &PlayerHand{
		hand:  make(map[uuid.UUID]*deck.Card),
		melds: make(map[deck.CardRank][]*deck.Card),
	}
}

func (h *PlayerHand) AddCardToHand(c *deck.Card) {
	h.hand[c.ID] = c
}

func (h *PlayerHand) AddCardToMeld(c *deck.Card, meldRank deck.CardRank) {
	h.melds[meldRank] = append(h.melds[meldRank], c)
}

func (h *PlayerHand) MoveCardsToMeld(cardIDs []uuid.UUID, meldRank deck.CardRank) {
	if _, ok := h.melds[meldRank]; !ok {
		h.melds[meldRank] = []*deck.Card{}
	}

	for _, cardID := range cardIDs {
		card := h.hand[cardID]
		delete(h.hand, cardID)

		h.melds[meldRank] = append(h.melds[meldRank], card)
	}
}

func (h *PlayerHand) HandCard(cardID uuid.UUID) (*deck.Card, error) {
	c, isOk := h.hand[cardID]
	if !isOk {
		return nil, errors.New("Card not in hand")
	}
	return c, nil
}

func (h *PlayerHand) RemoveCardFromHand(cardID uuid.UUID) {
	delete(h.hand, cardID)
}

func (h *PlayerHand) Hand() []*deck.Card {
	hand := []*deck.Card{}
	for _, c := range h.hand {
		hand = append(hand, c)
	}
	return hand
}

func (h *PlayerHand) Melds() map[deck.CardRank][]*deck.Card {
	return h.melds
}

// TODO: Do we ever have 0 length melds
func (h *PlayerHand) HasMeldWithRank(meldRank deck.CardRank) bool {
	_, hasMeld := h.melds[meldRank]
	return hasMeld
}
