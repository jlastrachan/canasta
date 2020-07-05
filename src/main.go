package main

import (
	"fmt"
	"github.com/jlastrachan/canasta/router"
	"log"
	"net/http"
	"os"
	"time"
)

const port = "8080"

func main() {
	fmt.Println("Hello World")
	// dbinfo := fmt.Sprintf("user=%s password=%s dbname=%s port=%s sslmode=disable",
	// 	config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.PORT)
	// db, err := sql.Open("postgres", dbinfo)
	// checkErr(err)
	// log.Printf("Postgres started at %s PORT", config.PORT)
	// defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	s := &http.Server{
		Addr:           ":" + port,
		Handler:        router.Serve(),
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	log.Fatal(s.ListenAndServe())
}
