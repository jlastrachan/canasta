package game

import (
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/user"
	"github.com/stretchr/testify/assert"
	"testing"
)

func createTestGame() *Game {
	g := Init()
	g.StartWithUsers([]*user.User{
		{ID: uuid.New(), Name: "player 1"},
		{ID: uuid.New(), Name: "player 2"},
	}, 1)
	return g
}

func TestStartGame(t *testing.T) {
	g := createTestGame()

	assert.Equal(t, len(g.Users), 2)
	assert.Equal(t, g.State, State{Status: AwaitingTurn, Turn: 1})
	assert.Equal(t, len(g.Deck.DiscardPile), 1)

	// TODO: This happens in lifecycle.go now
	// for _, u := range g.Users {
	// 	assert.Equal(t, g.NumCardsInPlayerHand(u.ID), 15)
	// 	assert.Equal(t, len(g.GetPlayerHand(u.ID).Melds()), 0)
	// }
}
