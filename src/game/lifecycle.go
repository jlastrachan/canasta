package game

import (
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/deck"
	game_model "github.com/jlastrachan/canasta/src/models/game"
	"github.com/jlastrachan/canasta/src/models/match"
	"github.com/jlastrachan/canasta/src/models/user"
)

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

// MeldError custom meld error
type MeldError struct {
	error
	Message string `json:"message"`
	Code    string `json:"code"`
}

// StartGame TODO
func StartGame(m *match.Match, userModel *user.UserModel) {
	users := userModel.List()
	m.StartWithUsers(users)

	// Deal out the first hand
	for _, u := range users {
		for i := 0; i < getNumCardsPerHand(len(users)); i++ {
			dealCard(m.CurrentGame, u.ID)
		}
	}
}

// GetHand TODO
func GetHand(gameModel *game_model.Game, userID uuid.UUID) []*deck.Card {
	return gameModel.GetPlayerHand(userID).Hand()
}

// GameState TODO
type GameState struct {
	Hand         []*deck.Card                                 `json:"hand"`
	State        game_model.GameStatus                        `json:"status"`
	Turn         uuid.UUID                                    `json:"turn"`
	Players      []*GamePlayer                                `json:"players"`
	TopOfDiscard *deck.Card                                   `json:"top_of_discard"`
	Melds        map[uuid.UUID]map[deck.CardRank][]*deck.Card `json:"melds"`
}

// GamePlayer TODO
type GamePlayer struct {
	UserID   uuid.UUID `json:"user_id"`
	Name     string    `json:"name"`
	NumCards int       `json:"num_cards"`
}

// GetGameState TODO
func GetGameState(gameModel *game_model.Game, userID uuid.UUID) (GameState, error) {
	if len(gameModel.Users) == 0 {
		return GameState{}, errors.New("No current game")
	}

	gamePlayers := []*GamePlayer{}
	for _, user := range gameModel.Users {
		if user.ID == userID {
			continue
		}

		gamePlayers = append(gamePlayers, &GamePlayer{
			UserID:   user.ID,
			Name:     user.Name,
			NumCards: gameModel.NumCardsInPlayerHand(user.ID),
		})
	}
	var topOfDiscard *deck.Card
	if len(gameModel.Deck.DiscardPile) > 0 {
		topOfDiscard = gameModel.Deck.DiscardPile[0]
	}

	melds := make(map[uuid.UUID]map[deck.CardRank][]*deck.Card)
	for _, user := range gameModel.Users {
		melds[user.ID] = gameModel.GetPlayerHand(user.ID).Melds()
	}

	return GameState{
		Hand:         gameModel.GetPlayerHand(userID).Hand(),
		State:        gameModel.State.Status,
		Turn:         gameModel.Users[gameModel.State.Turn].ID,
		Players:      gamePlayers,
		Melds:        melds,
		TopOfDiscard: topOfDiscard,
	}, nil
}

func dealCard(g *game_model.Game, userID uuid.UUID) {
	card := g.Deck.PopCard()
	playerHand := g.GetPlayerHand(userID)

	if card.IsRedThree() {
		playerHand.AddCardToMeld(card, card.Rank)
		dealCard(g, userID)
	} else {
		playerHand.AddCardToHand(card)
	}
}

// Meld Melds the provided cards with the provided rank for the user
func Meld(g *game_model.Game, userID uuid.UUID, melds map[deck.CardRank][]uuid.UUID) error {
	err := isValidMeld(g, userID, melds)
	if err != nil {
		return err
	}

	for cardRank, cardIDs := range melds {
		g.Meld(userID, cardRank, cardIDs)
	}
	return nil
}

// TODO: could be multiple melds
func isValidMeld(g *game_model.Game, userID uuid.UUID, melds map[deck.CardRank][]uuid.UUID) error {
	// If user is opening, total all meld scores
	openingScore := 0
	discardInMeld := g.State.TopOfDiscard == nil
	for cardRank, cardIDs := range melds {
		if cardRank == deck.Three && !canUserGoOut(userID) {
			return errors.New("Can't meld 3s unless going out")
		}

		if g.State.TopOfDiscard != nil && !discardInMeld {
			for _, cardID := range cardIDs {
				if cardID == g.State.TopOfDiscard.ID {
					discardInMeld = true
					break
				}
			}
		}

		ph := g.GetPlayerHand(userID)
		meldCards := []*deck.Card{}
		for _, cardID := range cardIDs {
			c, err := ph.HandCard(cardID)
			if err != nil {
				return err
			}
			meldCards = append(meldCards, c)
		}

		totalMelds := 0
		var existingMeld []*deck.Card
		for meldRank, meld := range ph.Melds() {
			if meldRank != deck.Three {
				totalMelds++
			}

			if cardRank == meldRank {
				existingMeld = meld
				break
			}
		}

		if totalMelds == 0 {
			openingScore += ScoreMeld(meldCards)
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
	}

	// TODO: Based on match score
	meldPoints := 50
	if 0 < openingScore && openingScore < meldPoints {
		return MeldError{Message: fmt.Sprintf("Need %d points to open", meldPoints), Code: "not_enough_to_open"}
	}

	if !discardInMeld {
		return errors.New("Meld must include top of discard")
	}

	return nil
}

// PickCard User opts to pick a new card for their turn
func PickCard(g *game_model.Game, userID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if g.State.Status != game_model.AwaitingTurn {
		return errors.New("Not at beginning of turn")
	}

	dealCard(g, userID)

	g.SetState(game_model.State{
		Status: game_model.PlayingTurn,
		Turn:   g.State.Turn,
	})
	return nil
}

// PickPile User opts to pick up the pile for their turn
func PickPile(g *game_model.Game, userID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if g.State.Status != game_model.AwaitingTurn {
		return errors.New("Not at beginning of turn")
	}
	topOfDiscard := g.Deck.DiscardPile[0]

	err := canPickPile(g, userID, topOfDiscard)
	if err != nil {
		return err
	}

	ph := g.GetPlayerHand(userID)
	discard := g.Deck.PopDiscardPile()
	for _, card := range discard {
		ph.AddCardToHand(card)
	}

	g.SetState(game_model.State{
		Status:       game_model.PickedDiscardPile,
		Turn:         g.State.Turn,
		TopOfDiscard: topOfDiscard,
	})
	return nil
}

func canPickPile(g *game_model.Game, userID uuid.UUID, topOfPile *deck.Card) error {
	if topOfPile.IsBlackThree() {
		return errors.New("Can't pick up pile with black three on top")
	}

	if topOfPile.IsWildCard() {
		return errors.New("Can't pick up with wild card on top")
	}

	ph := g.GetPlayerHand(userID)
	if !g.Deck.IsDiscardFrozen() && ph.HasMeldWithRank(topOfPile.Rank) {
		// Can add to existing meld
		return nil
	}

	numRankInHand := 0
	for _, card := range ph.Hand() {
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

// Discard User picks a card to discard at the end of their turn
func Discard(g *game_model.Game, userID uuid.UUID, cardID uuid.UUID) error {
	if g.Users[g.State.Turn].ID != userID {
		return errors.New("Not your turn")
	}

	if !(g.State.Status == game_model.PlayingTurn) {
		return errors.New("Can't discard at this turn state")
	}

	ph := g.GetPlayerHand(userID)
	card, err := ph.HandCard(cardID)
	if err != nil {
		return err
	}
	ph.RemoveCardFromHand(cardID)
	g.Deck.Discard(card)

	if canUserGoOut(userID) {
		EndHand()
		return nil
	}

	g.SetState(game_model.State{
		Turn:   (g.State.Turn + 1) % len(g.Users),
		Status: game_model.AwaitingTurn,
	})

	return nil
}

func canUserGoOut(userID uuid.UUID) bool {
	return false
}

// EndHand The hand is over, handles scoring
func EndHand() {
}
