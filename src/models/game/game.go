package game

import (
	"errors"
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/models/deck"
	"github.com/jlastrachan/canasta/models/user"
)

type GameStatus string

const (
	AwaitingTurn      GameStatus = "AWAITING_TURN"
	PickedDiscardPile            = "PICKED_DISCARD_PILE"
	PlayingTurn                  = "PLAYING_TURN"
	HandEnded                    = "HAND_ENDED"
	GameOver                     = "GAME_OVER"
)

type Game struct {
	Users       []*user.User `json:"users"`
	Deck        *deck.Deck   `json:"deck"`
	hands       map[uuid.UUID]map[uuid.UUID]*deck.Card
	DiscardPile []*deck.Card                                 `json:"discard_pile"`
	Melds       map[uuid.UUID]map[deck.CardRank][]*deck.Card `json:"melds"`
	Scores      map[uuid.UUID]int
	FirstTurn   int
	State       State
}

type State struct {
	Status       GameStatus
	Turn         int
	TopOfDiscard *deck.Card
}

func getNumCardsPerHand(numUsers int) int {
	switch numUsers {
	case 3:
		return 13
	case 4:
		return 11
	default:
		return 15
	}
}

func Init() *Game {
	return &Game{
		// TODO: How many decks
		Deck:  deck.GetDeck(2),
		Melds: make(map[uuid.UUID]map[deck.CardRank][]*deck.Card),
	}
}

func (g *Game) StartWithUsers(users []*user.User) {
	g.Users = users
	g.StartHand()
	g.Scores = make(map[uuid.UUID]int)

	for _, u := range users {
		g.Scores[u.ID] = 0
	}
	g.FirstTurn = 0
}

func (g *Game) StartHand() {
	hands := make(map[uuid.UUID]map[uuid.UUID]*deck.Card)

	for _, u := range g.Users {
		g.Melds[u.ID] = map[deck.CardRank][]*deck.Card{}
		hand := map[uuid.UUID]*deck.Card{}
		for i := 0; i < getNumCardsPerHand(len(g.Users)); i++ {
			card := g.Deck.PopCard()
			hand[card.ID] = card
		}
		hands[u.ID] = hand
	}
	g.hands = hands

	c := g.Deck.PopCard()
	g.DiscardPile = []*deck.Card{c}

	g.FirstTurn = (g.FirstTurn + 1) % len(g.Users)
	g.State = State{
		Status: AwaitingTurn,
		Turn:   g.FirstTurn,
	}
}

func (g *Game) GetHand(userID uuid.UUID) []*deck.Card {
	hand := []*deck.Card{}
	for _, card := range g.hands[userID] {
		hand = append(hand, card)
	}
	return hand
}

func (g *Game) Meld(userID uuid.UUID, cardRank deck.CardRank, cardIDs []uuid.UUID) error {
	err := g.isValidMeld(userID, cardRank, cardIDs)
	if err != nil {
		return err
	}
	g.meld(userID, cardRank, cardIDs)

	//g.addBonusForMeld(userID, ) TODO
	g.State = State{
		Status: PlayingTurn,
		Turn:   g.State.Turn,
	}
	return nil
}

func (g *Game) addBonusForMeld(userID, meld []*deck.Card) {
	// TODO: Concealed canasta
}

func (g *Game) meld(userID uuid.UUID, cardRank deck.CardRank, cardIDs []uuid.UUID) {
	usersMeld := g.Melds[userID]
	if _, ok := usersMeld[cardRank]; !ok {
		usersMeld[cardRank] = []*deck.Card{}
	}

	for _, cardID := range cardIDs {
		card := g.hands[userID][cardID]
		delete(g.hands[userID], cardID)

		usersMeld[cardRank] = append(usersMeld[cardRank], card)
	}
}

func (g *Game) isValidMeld(userID uuid.UUID, cardRank deck.CardRank, cardIDs []uuid.UUID) error {
	if cardRank == deck.Three && !g.canUserGoOut(userID) {
		return errors.New("Can't meld 3s unless going out")
	}

	if g.State.TopOfDiscard != nil {
		discardInMeld := false
		for _, cardID := range cardIDs {
			if cardID == g.State.TopOfDiscard.ID {
				discardInMeld = true
				break
			}
		}

		if !discardInMeld {
			return errors.New("Meld must include top of discard")
		}
	}

	meldCards := []*deck.Card{}
	for _, cardID := range cardIDs {
		meldCards = append(meldCards, g.hands[userID][cardID])
	}

	totalMelds := 0
	var existingMeld []*deck.Card
	for meldRank, meld := range g.Melds[userID] {
		if meldRank != deck.Three {
			totalMelds++
		}

		if cardRank == meldRank {
			existingMeld = meld
			break
		}
	}

	if totalMelds == 0 {
		if ScoreMeld(meldCards) < 50 {
			return errors.New("Need 50 points to start meld")
		}
	}

	numNaturalCards := 0
	numWildCards := 0

	if existingMeld != nil {
		for _, c := range existingMeld {
			if c.IsWildCard() {
				numWildCards++
			} else {
				numNaturalCards++
			}
		}
	}

	for _, c := range meldCards {
		if c.IsWildCard() {
			numWildCards++
		} else {
			numNaturalCards++
		}
	}

	if numNaturalCards < 2 {
		return errors.New("Need at least 2 natural cards")
	}

	if numWildCards > 3 {
		return errors.New("Need 3 or less wild cards")
	}

	if numNaturalCards+numWildCards < 3 {
		return errors.New("Need at least 3 cards")
	}

	return nil
}

func (g *Game) PickCard(userID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if g.State.Status != AwaitingTurn {
		return errors.New("Not at beginning of turn")
	}

	card := g.Deck.PopCard()

	if card.Rank == deck.Three && (card.Suit == deck.Hearts || card.Suit == deck.Diamonds) {
		g.meld(userID, deck.Three, []uuid.UUID{card.ID})
		return g.PickCard(userID)
	}

	g.hands[userID][card.ID] = card
	g.State.Status = PlayingTurn
	return nil
}

func (g *Game) PickPile(userID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if g.State.Status != AwaitingTurn {
		return errors.New("Not at beginning of turn")
	}
	topOfDiscard := g.DiscardPile[0]

	err := g.canPickPile(userID, topOfDiscard)
	if err != nil {
		return err
	}

	for _, card := range g.DiscardPile {
		g.hands[userID][card.ID] = card
	}
	g.DiscardPile = []*deck.Card{}

	g.State = State{
		Status:       PickedDiscardPile,
		Turn:         g.State.Turn,
		TopOfDiscard: topOfDiscard,
	}
	return nil
}

func (g *Game) canPickPile(userID uuid.UUID, topOfPile *deck.Card) error {
	if topOfPile.IsBlackThree() {
		return errors.New("Can't pick up pile with black three on top")
	}

	if topOfPile.IsWildCard() {
		return errors.New("Can't pick up with wild card on top")
	}

	_, hasExistingMeld := g.Melds[userID][topOfPile.Rank]
	if !g.isDiscardFrozen() && hasExistingMeld {
		// Can add to existing meld
		return nil
	}

	numRankInHand := 0
	for _, card := range g.hands[userID] {
		if card.Rank == topOfPile.Rank || card.IsWildCard() {
			numRankInHand++
		}
	}
	if numRankInHand >= 2 {
		// TODO: What if first meld

		// Can thaw pile or create new meld with natural cards in hand
		return nil
	}

	return errors.New("Can't pick up pile")
}

func (g *Game) isDiscardFrozen() bool {
	for _, c := range g.DiscardPile {
		if c.IsWildCard() {
			return true
		}
	}
	return false
}

func (g *Game) Discard(userID uuid.UUID, cardID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if !(g.State.Status == PlayingTurn) {
		return errors.New("Can't discard at this turn state")
	}

	if _, ok := g.hands[userID][cardID]; !ok {
		return errors.New("Card not in hand")
	}
	card := g.hands[userID][cardID]
	delete(g.hands[userID], cardID)

	g.DiscardPile = append([]*deck.Card{card}, g.DiscardPile...)

	if g.canUserGoOut(userID) {
		g.EndHand()
		return nil
	}

	g.State = State{
		Turn:   (g.State.Turn + 1) % len(g.Users),
		Status: AwaitingTurn,
	}

	return nil
}

func (g *Game) canUserGoOut(userID uuid.UUID) bool {
	return false
}

func (g *Game) EndHand() {
}
