package router

import (
	"encoding/json"
	"fmt"
	"github.com/alecthomas/template"
	"github.com/google/uuid"
	"github.com/jlastrachan/canasta/src/game"
	"github.com/jlastrachan/canasta/src/models/deck"
	game_model "github.com/jlastrachan/canasta/src/models/game"
	"github.com/jlastrachan/canasta/src/models/user"
	"github.com/jlastrachan/canasta/src/webpack"
	"io/ioutil"
	"net/http"
	"path"
)

type Handler struct {
	userModel *user.UserModel
	game      *game_model.Game
}

func NewHandler() *Handler {
	return &Handler{
		userModel: user.New(),
		game:      game_model.Init(),
	}
}

type AddUserRequest struct {
	Name string
}

func (h *Handler) GetIndexHandler(buildPath string) http.HandlerFunc {
	files, err := ioutil.ReadDir(".")
	if err != nil {
		panic(err)
	}

	for _, file := range files {
		fmt.Println(file.Name())
	}

	tmpl, err := template.ParseFiles(path.Join("src", "templates", "index.html"))

	if err != nil {
		return func(res http.ResponseWriter, req *http.Request) {
			http.Error(res, err.Error(), http.StatusInternalServerError)
		}
	}

	data, err := NewViewData(buildPath)

	if err != nil {
		return func(res http.ResponseWriter, req *http.Request) {
			http.Error(res, err.Error(), http.StatusInternalServerError)
		}
	}

	return func(res http.ResponseWriter, req *http.Request) {
		if err := tmpl.Execute(res, data); err != nil {
			http.Error(res, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (h *Handler) AddUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	fmt.Println(string(body))

	var newUser AddUserRequest
	err = json.Unmarshal(body, &newUser)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	user, err := game.AddUser(h.userModel, newUser.Name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	okStatus(w)
	json.NewEncoder(w).Encode(user)
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.NotFound(w, r)
		return
	}

	users := game.ListUsers(h.userModel)
	okStatus(w)
	json.NewEncoder(w).Encode(users)
}

func (h *Handler) StartGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.NotFound(w, r)
		return
	}

	game.StartGame(h.game, h.userModel)
	okStatus(w)
}

type UserIDRequest struct {
	UserID uuid.UUID `json:"user_id"`
}

func (h *Handler) GetHand(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var req UserIDRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	ret := game.GetHand(h.game, req.UserID)
	okStatus(w)
	json.NewEncoder(w).Encode(ret)
}

func (h *Handler) GameState(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.NotFound(w, r)
		return
	}

	userIDs, ok := r.URL.Query()["user_id"]
	if !ok {
		fmt.Println(ok)
		http.NotFound(w, r)
		return
	}

	if len(userIDs) < 1 {
		fmt.Println(len(userIDs))
		http.NotFound(w, r)
		return
	}

	fmt.Println(userIDs)

	userID, err := uuid.Parse(userIDs[0])
	if err != nil {
		fmt.Println(err)
		http.NotFound(w, r)
		return
	}

	ret := game.GetGameState(h.game, userID)
	okStatus(w)
	json.NewEncoder(w).Encode(ret)
}

func (h *Handler) RestartGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.NotFound(w, r)
		return
	}

	h.game = game_model.Init()
	h.userModel = user.New()
	okStatus(w)
}

func (h *Handler) PickCard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var req UserIDRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	err = h.game.PickCard(req.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	okStatus(w)
	ret := game.GetGameState(h.game, req.UserID)
	json.NewEncoder(w).Encode(ret)
}

func (h *Handler) PickPile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var req UserIDRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	err = h.game.PickPile(req.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	okStatus(w)
	ret := game.GetGameState(h.game, req.UserID)
	json.NewEncoder(w).Encode(ret)
}

type MeldRequest struct {
	UserID   uuid.UUID     `json:"user_id"`
	MeldRank deck.CardRank `json:"meld_rank"`
	CardIDs  []uuid.UUID   `json:"card_ids"`
}

func (h *Handler) Meld(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var req MeldRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	err = h.game.Meld(req.UserID, req.MeldRank, req.CardIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	okStatus(w)
	ret := game.GetGameState(h.game, req.UserID)
	json.NewEncoder(w).Encode(ret)
}

type DiscardRequest struct {
	UserID uuid.UUID `json:"user_id"`
	CardID uuid.UUID `json:"card_id"`
}

func (h *Handler) Discard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.NotFound(w, r)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var req DiscardRequest
	err = json.Unmarshal(body, &req)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	err = h.game.Discard(req.UserID, req.CardID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	okStatus(w)
	ret := game.GetGameState(h.game, req.UserID)
	json.NewEncoder(w).Encode(ret)
}

// User represents current user session
type User struct {
	Email     string
	FirstName string
	LastName  string
}

// ViewData contains data for the view
type ViewData struct {
	CurrentUser User
	Webpack     *webpack.Webpack
}

// NewViewData creates new data for the view
func NewViewData(buildPath string) (ViewData, error) {
	wp, err := webpack.New(buildPath)

	if err != nil {
		return ViewData{}, fmt.Errorf("failed to read webpack configuration: %w", err)
	}

	return ViewData{
		CurrentUser: User{
			Email:     "bill@example.com",
			FirstName: "Bill",
			LastName:  "Black",
		},
		Webpack: wp,
	}, nil
}
