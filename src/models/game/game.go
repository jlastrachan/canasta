package game

import (
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/deck"
	"github.com/jlastrachan/canasta/src/models/player_hand"
	"github.com/jlastrachan/canasta/src/models/user"
)

// GameStatus An enum representing the state of the game's state machine
type GameStatus string

const (
	// AwaitingTurn Waiting on a user to initiate their turn
	AwaitingTurn GameStatus = "AWAITING_TURN"

	// PickedDiscardPile The user playing a turn has just picked the discard pile. They must
	// meld with the top card from the pile.
	PickedDiscardPile = "PICKED_DISCARD_PILE"

	// PlayingTurn A user is currently in the middle of playing their turn
	PlayingTurn = "PLAYING_TURN"

	// HandEnded The current hand has ended, but the game isn't over
	HandEnded = "HAND_ENDED"

	// GameOver A player has won and the game is over
	GameOver = "GAME_OVER"
)

// Game The base model of the game
type Game struct {
	Users       []*user.User
	Deck        *deck.Deck
	State       State
	PlayerHands map[uuid.UUID]*player_hand.PlayerHand
}

// State The current state of the game in its state machine
type State struct {
	Status       GameStatus
	Turn         int
	TopOfDiscard *deck.Card
}

// Init Clears the current game and prepares for a new one
func Init() *Game {
	return &Game{
		Deck: deck.GetDeck(2),
	}
}

// StartWithUsers Starts a new game with the provided users
func (g *Game) StartWithUsers(users []*user.User, firstTurn int) {
	g.Users = users

	g.PlayerHands = make(map[uuid.UUID]*player_hand.PlayerHand)

	for _, u := range g.Users {
		playerHand := player_hand.CreateHand()
		g.PlayerHands[u.ID] = playerHand
	}

	g.State = State{
		Status: AwaitingTurn,
		Turn:   firstTurn,
	}

	g.Deck.Discard(g.Deck.PopCard())
}

// NumCardsInPlayerHand TODO
func (g *Game) NumCardsInPlayerHand(userID uuid.UUID) int {
	return len(g.PlayerHands[userID].Hand())
}

// GetPlayerHand TODO
func (g *Game) GetPlayerHand(userID uuid.UUID) *player_hand.PlayerHand {
	return g.PlayerHands[userID]
}

// Meld TODO
func (g *Game) Meld(userID uuid.UUID, cardRank deck.CardRank, cardIDs []uuid.UUID) {
	g.GetPlayerHand(userID).MoveCardsToMeld(cardIDs, cardRank)

	g.SetState(State{
		Status: PlayingTurn,
		Turn:   g.State.Turn,
	})
}

// SetState TODO
func (g *Game) SetState(s State) {
	g.State = s
}
