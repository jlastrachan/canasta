package user

import "github.com/google/uuid"

type UserModel struct {
	userDB map[uuid.UUID]*User
}

type User struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

func New() *UserModel {
	return &UserModel{
		userDB: make(map[uuid.UUID]*User),
	}
}

func (u *UserModel) Add(name string) (*User, error) {
	uID, err := uuid.NewUUID()
	if err != nil {
		return nil, err
	}

	u.userDB[uID] = &User{
		ID:   uID,
		Name: name,
	}

	return u.userDB[uID], nil
}

func (u *UserModel) Get(id uuid.UUID) *User {
	return u.userDB[id]
}

func (u *UserModel) List() []*User {
	ret := []*User{}
	for _, v := range u.userDB {
		ret = append(ret, v)
	}
	return ret
}
