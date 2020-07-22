export enum MatchState {
    Idle = "IDLE",
    InGame = "IN_GAME",
    GameOver = "GAME_OVER",
}

export enum HandState {
    AwaitingTurn = "AWAITING_TURN",
    PickedDiscardPile = "PICKED_DISCARD_PILE",
    PlayingTurn = "PLAYING_TURN",
    HandEnded = "HAND_ENDED",
}

export enum Suit {
    Clubs = "CLUBS",
    Hearts = "HEARTS",
    Spades = "SPADES",
    Diamonds = "DIAMONDS",
}

export interface GamePlayer {
    name: string,
    num_cards: number,
    user_id: string,
}


export interface GameState {
    turn: string,
    match_status: MatchState,
    hand: Array<Card>,
    hand_status: HandState,
    players: Array<GamePlayer>,
    melds: Map<string, Map<Rank, Array<Card>>>,
    top_of_discard: Card,
    discard_length: number,
    scores: {[key: string]: number}, // keyed by user_id
}

export interface Card {
    id: string,
    suit: Suit,
    rank: Rank,
}

export interface User {
    id: string,
    name: string,
}

export enum GameActions {
    PickCard = "PICK_CARD",
    PickDiscard = "PICK_DISCARD",
    Discard = "DISCARD",
    Meld = "MELD",
}

export type Rank = 'Ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Jack' | 'Queen' | 'King' | 'Joker';

export const rankToOrdinal = {
    'Ace': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'Jack': 11,
    'Queen': 12,
    'King': 13,
    'Joker': 14,
}