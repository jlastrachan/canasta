package router

import (
	"fmt"
	"net/http"
	"path"
)

func Serve() *http.ServeMux {
	mux := http.NewServeMux()
	h := NewHandler()

	buildPath := path.Clean("web")
	staticPath := path.Join(buildPath, "/static/")

	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(staticPath))))
	mux.HandleFunc("/add_user", h.AddUser)
	mux.HandleFunc("/list_users", h.ListUsers)
	mux.HandleFunc("/start_game", h.StartMatch)
	mux.HandleFunc("/get_hand", h.GetHand)
	mux.HandleFunc("/game_state", h.GameState)
	mux.HandleFunc("/restart_game", h.RestartGame)
	mux.HandleFunc("/pick_card", h.PickCard)
	mux.HandleFunc("/pick_pile", h.PickPile)
	mux.HandleFunc("/meld", h.Meld)
	mux.HandleFunc("/discard", h.Discard)
	mux.HandleFunc("/", h.GetIndexHandler(buildPath))
	return mux
}

func okStatus(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)

	return
}

func handleHomePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, the site is running :)")
}
