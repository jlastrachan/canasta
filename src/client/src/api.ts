import { Rank, GameState, User } from './types';

interface AddUserResponse {
    id: string,
}

export class MeldError extends Error {
    code?: string

    constructor(message: string, code?: string) {
        super(message);
        this.message = message;
        this.code = code;
    }
}

export async function addUser(name: string): Promise<AddUserResponse> {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    };
    return fetch('/add_user', requestOptions).then(response => response.json());
}

export async function listUsers(): Promise<Array<User>> {
    const requestOptions = { method: 'GET' };
    return fetch('/list_users', requestOptions).then(response => response.json());
}

export async function getGameState(userID: string): Promise<GameState | undefined> {
    const requestOptions = {
        method: 'GET'
    };
    return fetch('/game_state?user_id=' + userID, requestOptions)
        .then(response => response.json())
        .catch((e) => {
            return undefined;
        });
}

export async function startGame(): Promise<{}> {
    const requestOptions = {
        method: 'GET',
    };
    return fetch('/start_game', requestOptions);
}

export async function clearGame(): Promise<{}> {
    const requestOptions = {
        method: 'GET',
    };
    return fetch('/restart_game', requestOptions);
}

interface PostRequestOptions {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: string,
}

function getUserIDBody(userID: string): PostRequestOptions {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: userID,
        }),
    };
}

export async function pickCard(userID: string): Promise<GameState> {
    return fetch('/pick_card', getUserIDBody(userID))
        .then(response => response.json());
}

export async function pickDiscard(userID: string): Promise<GameState> {
    return fetch('/pick_pile', getUserIDBody(userID))
        .then(response => response.json());
}

export async function discard(userID: string, cardID: string): Promise<GameState> {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userID,
          card_id: cardID,
        })
    };
    return fetch('/discard', requestOptions)
        .then(response => response.json());
}

export async function meld(
    userID: string, 
    melds: { [key in Rank]?: string[] },
    onError: (e: MeldError) => void,
): Promise<GameState> {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userID,
          melds,
        })
    };
    return fetch('/meld', requestOptions)
        .then(response => {
            if (response.status !== 200) {
                response.text().then(t => {
                try {
                    const err = JSON.parse(t);
                    onError(new MeldError(err.message, err.code));
                } catch {
                    onError(new MeldError(t));
                }});
                return;
            } else {
                return response.json();
            }
        });
}

export async function continueHand(): Promise<{}> {
    const requestOptions = {
        method: 'POST',
    };
    return fetch('/continue', requestOptions);
}