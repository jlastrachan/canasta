import React from 'react';
import { Card, GameState, HandState, MatchState, MeldMap, Rank, GameActions } from './types';
import {
  addUser,
  clearGame,
  continueHand,
  discard,
  getGameState,
  listUsers,
  meld,
  MeldError,
  pickCard,
  pickDiscard,
  startGame,
} from './api';
import { NavBar } from './components/navbar';
import { StartGame } from './components/StartGame';
import { GameView } from './components/GameView';
import { AfterHand } from './components/AfterHand';

interface GameControllerState {
    name: string,
    userID: string,
    gameState?: GameState,
    selectedCards: Array<string>,
    selectingMeldRank: boolean,
    pendingMeld?: MeldMap,
    registeredUsers: Array<string>,
}

export default class GameController extends React.Component<{}, GameControllerState> {
  constructor(props: {}) {
      super(props);
      this.state = {
          name: "",
          userID: "",
          gameState: undefined,
          selectedCards: [],
          selectingMeldRank: false,
          pendingMeld: undefined,
          registeredUsers: [],
      }
  }

  componentDidUpdate() {
    if (!this.state.gameState) {
      return;
    }

    const anotherUsersTurn = this.state.gameState.turn !== this.state.userID;
    const betweenHands = this.state.gameState.match_status === MatchState.Idle;

    if (anotherUsersTurn || betweenHands) {
      setTimeout(() => {
        this.getGameState();
      }, 1000)
    }
  }

  onJoinGameClick = (name: string) => {
    addUser(name)
    .then(data => this.setState({ userID: data.id }))
    .then(this.pollForGameStart);
  }

  pollForGameStart = () => {
    this.getGameState();
    this.getRegisteredUsers();

    if (!this.state.gameState) {
      setTimeout(() => {
        this.pollForGameStart();
      }, 1000);
    }
  }

  getGameState = () => {
    getGameState(this.state.userID)
    .then(data => {
      console.log(data);
      this.setState({ gameState: data })
    });
  }

  getRegisteredUsers = () => {
    listUsers().then(data => this.setState({ registeredUsers: data.map(u => u.name).sort()}));
  }

  onStartGameClick = () => {
    startGame().then(this.getGameState);
  }

  onClearGameClick = () => {
    clearGame().then(this.getGameState).then(() => this.setState({ userID: "", registeredUsers: [] }));
  }

  onPickCardClick = () => {
    pickCard(this.state.userID)
    .then(data => this.setState({ gameState: data}));
  }

  onPickDiscardClick = () => {
    pickDiscard(this.state.userID)
    .then(data => this.setState({ gameState: data }));
  }

  onDiscardClick = () => {
    if (this.state.selectedCards.length !== 1) {
      alert("Can only discard 1 card");
      return;
    }

    discard(this.state.userID, this.state.selectedCards[0])
    .then(data => this.setState({ gameState: data, selectedCards: [] }));
  }

  onContinueHandClick = () => {
    continueHand().then(this.getGameState);
  }

  onMeldClick = (overrideRank?: Rank) => {
    let meldRank: Rank | undefined = undefined;
    if (this.state.selectedCards.length === 0) {
      alert("Must select cards");
      return;
    }

    var canMeld = true;
    this.state.selectedCards.forEach(cardId => {
      this.state.gameState!.hand.forEach(card => {
        if (card.id === cardId) {
          if (card.rank !== '2' && card.rank !== 'Joker') {
            if (meldRank && meldRank !== card.rank) {
              alert("Must select cards from one rank + wildcards");
              canMeld=false;
            } else {
              meldRank = card.rank;
            }
          }
        }
      })
    });
    if (!canMeld) {
      return;
    }

    if (!meldRank) {
      if (overrideRank && typeof(overrideRank) === "string") {
        meldRank = overrideRank;
        this.setState({ selectingMeldRank: false });
      } else {
        // Only wild card selected
        this.setState({ selectingMeldRank: true });
        return;
      }
    }

    var melds = this.getPendingMelds();
    melds[meldRank] = this.state.selectedCards;

    const onError = (meldError: MeldError) => {
      if (meldError.code === "not_enough_to_open") {
        let pendingMeld: MeldMap = this.state.pendingMeld ? this.state.pendingMeld : {};
        pendingMeld[meldRank!] = this.getCardsFromHand(this.state.selectedCards);
        this.setState({ pendingMeld, selectedCards: [] });
      } else {
        alert(meldError.message);
      }
    }
    meld(this.state.userID, melds, onError)
      .then(data => {
        if (!data) {
          return;
        }

        this.setState({ gameState: data, selectedCards: [], pendingMeld: undefined })
      });
  }

  makeOnClickMeld = (rank: Rank) => {
    if (rank === '3') {
      return undefined;
    }

    return () => {
      this.onMeldClick(rank);
    }
  }

  getPendingMelds(): { [key in Rank]?: string[] } {
    var melds: { [key in Rank]?: string[] } = {};

    if (!this.state.pendingMeld) {
      return melds;
    }

    for (var rank in this.state.pendingMeld) {
      melds[rank as Rank] = this.state.pendingMeld[rank as Rank]!.map((c: Card) => c.id);
    }
    return melds;
  }

  getCardsFromHand(cardIDs: Array<string>): Array<Card> {
    var cards = new Array<Card>();

    if (!this.state.gameState) {
      return cards;
    }

    this.state.gameState.hand.forEach(c => {
      if (cardIDs.includes(c.id)) {
        cards.push(c);
      }
    })
    return cards;
  }

  makeOnClickCard = (card: Card) => {
    if (!this.state.gameState) {
      return undefined;
    }

    if (this.state.gameState.turn !== this.state.userID) {
      return undefined;
    }

    if (!(this.state.gameState.hand_status === HandState.PickedDiscardPile || 
        this.state.gameState.hand_status === HandState.PlayingTurn)) {
      return undefined;
    }

    return () => {
      var newSelection = this.state.selectedCards;
      if (this.state.selectedCards.includes(card.id)) {
        newSelection = this.state.selectedCards.filter(function(value, index, arr){ return value !== card.id});
      } else {
        newSelection.push(card.id);
      }
      this.setState({ selectedCards: newSelection });
    }
  } 

  onCancelPendingMeld = () => {
    this.setState({ pendingMeld: undefined });
  }

  getAllowedActions(): Array<GameActions> {
    let allowedActions = [];
    if (this.state.gameState?.turn === this.state.userID) {
      switch (this.state.gameState.hand_status) {
        case HandState.AwaitingTurn:
          allowedActions.push(GameActions.PickCard, GameActions.PickDiscard);
          break;
        case HandState.PickedDiscardPile:
          allowedActions.push(GameActions.Meld);
          break;
        case HandState.PlayingTurn:
          allowedActions.push(GameActions.Meld, GameActions.Discard);
          break;
      }
    }
    return allowedActions;
  }

  renderBody() {
    if (!this.state.gameState) {
      return <StartGame 
        onAddUserClick={this.onJoinGameClick}
        onStartGameClick={this.onStartGameClick}
        hasAlreadyJoined={Boolean(this.state.userID)}
        userNames={this.state.registeredUsers}
      />;
    } else if (this.state.gameState.match_status === MatchState.InGame) {
      return <GameView 
        userID={this.state.userID}
        allowedActions={this.getAllowedActions()}
        onDiscardClick={this.onDiscardClick}
        onMeldClick={() => this.onMeldClick()}
        onPickCardClick={this.onPickCardClick}
        onPickDiscardClick={this.onPickDiscardClick}
        gameState={this.state.gameState}
        selectedCards={this.state.selectedCards}
        onClickCardFactory={this.makeOnClickCard}
        onClickMeldFactory={this.state.selectingMeldRank ? this.makeOnClickMeld : undefined}
        pendingMelds={this.state.pendingMeld}
        onCancelPendingMelds={this.onCancelPendingMeld}
      />;
    } else {
      return <AfterHand
        matchState={this.state.gameState.match_status}
        scores={this.state.gameState.scores}
        userID={this.state.userID}
        otherPlayers={this.state.gameState.players}
        onContinueHandClick={this.onContinueHandClick}
      />
    }
  }

  render() {
    return (
      <div className="game-view" style={{ height: '100vh' }}>
        <NavBar onClearGameClick={this.onClearGameClick} />
        {this.renderBody()}
      </div>
    );
  }
}