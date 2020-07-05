package game

import (
	"github.com/jlastrachan/canasta/src/models/user"
)

func AddUser(userModel *user.UserModel, name string) (*user.User, error) {
	return userModel.Add(name)
}

func ListUsers(userModel *user.UserModel) []*user.User {
	return userModel.List()
}
