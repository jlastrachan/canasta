package match

import (
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/models/game"
	"github.com/jlastrachan/canasta/src/models/user"
)

type Status string

const (
	Idle      Status = "Idle"
	InGame           = "InGame"
	MatchOver        = "MatchOver"
)

type Match struct {
	Users       []*user.User
	Scores      map[uuid.UUID]int
	FirstTurn   int
	CurrentGame *game.Game
	Status      Status
}

func Init() *Match {
	return &Match{
		FirstTurn:   0,
		CurrentGame: game.Init(),
		Status:      Idle,
	}
}

func (m *Match) StartWithUsers(users []*user.User) {
	m.Users = users
	m.Scores = make(map[uuid.UUID]int)
	m.FirstTurn = (m.FirstTurn + 1) % len(users)

	for _, u := range users {
		m.Scores[u.ID] = 0
	}

	m.CurrentGame.StartWithUsers(users, m.FirstTurn)
}
