package game

import (
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/deck"
	game_model "github.com/jlastrachan/canasta/src/models/game"
	"github.com/jlastrachan/canasta/src/models/user"
)

func StartGame(gameModel *game_model.Game, userModel *user.UserModel) {
	users := userModel.List()
	gameModel.StartWithUsers(users)
}

func GetHand(gameModel *game_model.Game, userID uuid.UUID) []*deck.Card {
	return gameModel.GetHand(userID)
}

type GameState struct {
	Hand         []*deck.Card                                 `json:"hand"`
	State        game_model.GameStatus                        `json:"status"`
	Turn         uuid.UUID                                    `json:"turn"`
	Players      []*GamePlayer                                `json:"players"`
	TopOfDiscard *deck.Card                                   `json:"top_of_discard"`
	Melds        map[uuid.UUID]map[deck.CardRank][]*deck.Card `json:"melds"`
}

type GamePlayer struct {
	UserID   uuid.UUID `json:"user_id"`
	Name     string    `json:"name"`
	NumCards int       `json:"num_cards"`
}

func GetGameState(gameModel *game_model.Game, userID uuid.UUID) GameState {
	gamePlayers := []*GamePlayer{}
	for _, user := range gameModel.Users {
		if user.ID == userID {
			continue
		}

		gamePlayers = append(gamePlayers, &GamePlayer{
			UserID:   user.ID,
			Name:     user.Name,
			NumCards: len(gameModel.GetHand(user.ID)),
		})
	}
	var topOfDiscard *deck.Card
	if len(gameModel.DiscardPile) > 0 {
		topOfDiscard = gameModel.DiscardPile[0]
	}

	return GameState{
		Hand:         gameModel.GetHand(userID),
		State:        gameModel.State.Status,
		Turn:         gameModel.Users[gameModel.State.Turn].ID,
		Players:      gamePlayers,
		Melds:        gameModel.Melds,
		TopOfDiscard: topOfDiscard,
	}
}
