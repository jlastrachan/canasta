import React from 'react';
import './App.css';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const rankToOrdinal = {
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

export default class GameView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      userID: "",
      gameState: null,
      selectedCards: [],
      selectingMeldRank: false,
      pendingMeld: null,
    };
  }

  componentDidUpdate() {
    if (!this.state.gameState) {
      return;
    }

    const anotherUsersTurn = this.state.gameState.turn !== this.state.userID;
    const betweenHands = this.state.gameState.match_state === 'IDLE';

    if (anotherUsersTurn || betweenHands) {
      setTimeout(() => {
        this.getGameState();
      }, 1000)
    }
  }

  onJoinGameClick = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.state.name })
    };
    fetch('/add_user', requestOptions)
        .then(response => response.json())
        .then(data => this.setState({ userID: data.id }))
        .then(this.pollForGameStart());
  }

  pollForGameStart = () => {
    this.getGameState(); 

    if (!this.state.gameState) {
      setTimeout(() => {
        this.pollForGameStart();
      }, 1000)
    }
  }

  onTextChange = (e) => {
    this.setState({name: e.target.value})
  }

  getGameState = () => {
    const requestOptions = {
      method: 'GET'
    };
    fetch('/game_state?user_id=' + this.state.userID, requestOptions)
        .then(response => response.json())
        .catch(() => undefined)
        .then(data => this.setState({ gameState: data }));
  }

  onStartGame = () => {
    const requestOptions = {
      method: 'GET',
    };
    fetch('/start_game', requestOptions)
    .then(this.getGameState);
  }

  onClearGame = () => {
    const requestOptions = {
      method: 'GET',
    };
    fetch('/restart_game', requestOptions)
        .then(() => {
          this.setState({ gameState: null, userID: "", selectedCards: [] });
        });
  }

  onClickPickCard = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: this.state.userID,
      })
    };
    fetch('/pick_card', requestOptions)
    .then(response => response.json())
    .then(data => {
      this.setState({ gameState: data })
    });
  }

  onClickPickDiscard = () => {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: this.state.userID,
      })
    };
    fetch('/pick_pile', requestOptions)
    .then(response => response.json())
    .then(data => {
      this.setState({ gameState: data })
    }); 
  }

  onClickDiscard = () => {
    if (this.state.selectedCards.length !== 1) {
      alert("Can only discard 1 card");
      return;
    }

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: this.state.userID,
        card_id: this.state.selectedCards[0],
      })
    };
    fetch('/discard', requestOptions)
    .then(response => response.json())
    .then(data => {
      this.setState({ gameState: data, selectedCards: [] });
    }); 
  }

  onContinueHand = () => {
    const requestOptions = {
      method: 'POST',
    };
    fetch('/continue', requestOptions).then(this.getGameState);
  }

  onClickMeld = (overrideRank) => {
    var meldRank = "";
    if (this.state.selectedCards.length === 0) {
      alert("Must select cards");
      return;
    }
    var canMeld = true;
    this.state.selectedCards.forEach(cardId => {
      this.state.gameState.hand.forEach(card => {
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

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: this.state.userID,
        melds,
      })
    };
    fetch('/meld', requestOptions)
    .then(response => {
      if (response.status !== 200) {
        response.text().then(t => {
          try {
            const err = JSON.parse(t);
            if (err.code === "not_enough_to_open") {
              var pendingMeld = this.state.pendingMeld ? this.state.pendingMeld : {};
              pendingMeld[meldRank] = this.getCardsFromHand(this.state.selectedCards);
              this.setState({ pendingMeld, selectedCards: [] });
            } else {
              alert(JSON.parse(t).message);
            }
          } catch {
            alert(t);
          }
        });
      } else {
        response.json().then(data => this.setState({ gameState: data, selectedCards: [], pendingMeld: null }));
      }
    });
  }

  getPendingMelds() {
    if (!this.state.pendingMeld) {
      return {};
    }

    var melds = {};
    for (var rank in this.state.pendingMeld) {
      melds[rank] = this.state.pendingMeld[rank].map(c => c.id);
    }
    return melds;
  }

  getCardsFromHand(cardIDs) {
    var cards = [];

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

  makeOnClickCard = (card) => {
    if (!this.state.gameState) {
      return null;
    }

    if (this.state.gameState.turn !== this.state.userID) {
      return null;
    }

    if (!(this.state.gameState.hand_status === 'PICKED_DISCARD_PILE' || this.state.gameState.hand_status === 'PLAYING_TURN')) {
      return null;
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

  sortCards(toSort) {
    return toSort.sort((a, b) => {
      if (rankToOrdinal[a.rank] < rankToOrdinal[b.rank]) {
        return -1;
      } else if (rankToOrdinal[a.rank] > rankToOrdinal[b.rank]) {
        return 1;
      }
      if (a.suit < b.suit) {
        return -1;
      } else if (a.suit > b.suit) {
        return 1;
      }
      return 0;
    });
  }

  renderHand() {
    if (!this.state.gameState) {
      return;
    }

    var hand = this.state.gameState.hand;
    if (this.state.pendingMeld) {
      // Filter out all cards which are pending melds
      const allPending = [];
      for (var key in this.state.pendingMeld) {
        this.state.pendingMeld[key].forEach(c => {
          allPending.push(c.id);
        });
      }
      hand = hand.filter((c) => !allPending.includes(c.id));
    }

    hand = this.sortCards(hand);
    const score = this.state.gameState.scores[this.state.userID];

    return (
      <div style={{border: '1px black solid'}}>
        <h3>My Hand (Score {score})</h3>
        <div style={{display: 'inline-block'}}>
          {hand.map((value, index) => {
          return <div style={{display: 'inline-block'}}>{this.renderCard(value, 'large', this.makeOnClickCard(value))}</div>
        })}
        </div>
      </div>
    );
  }

  renderCard(card, size, onClick) {
    function importAll(r) {
      let images = {};
      r.keys().forEach((item, index) => { images[item.replace('./', '')] = r(item); });
      return images;
    }
    
    const images = importAll(require.context('./cards', false, /\.(png|jpe?g|svg)$/));
    const imageSrc = `${card.rank.toLowerCase()}_of_${card.suit.toLowerCase()}.png`;
    
    const width = size === 'large' ? "100px" : "50px";
    const height = size === 'large' ? "145px" : "72px";
    
    const img = <img alt={imageSrc} key={card.id} src={images[imageSrc]} style={{width, height}}></img>;

    var variant = "light";
    if (this.state.selectedCards.includes(card.id)) {
      variant = "danger";
    }

    if (onClick) {
      return (
        <div>
          <WrappedButton variant={variant} onClick={onClick}>{img}</WrappedButton>
        </div>
      );
    }

    return (
      <div style={{paddingLeft: '22px', paddingRight: '22px', paddingTop: '6px', paddingBottom: '6px'}}>
        {img}
      </div>
    )
  }

  renderActions() {
    if (!this.state.gameState) {
      return;
    }

    if (this.state.gameState.turn !== this.state.userID) {
      return <h3>Not your turn</h3>;
    }

    const gameState = this.state.gameState.hand_status;

    if (gameState === 'AWAITING_TURN') {
      return (
        <div>
          <WrappedButton onClick={this.onClickPickCard}>Pick Card</WrappedButton>
          <WrappedButton onClick={this.onClickPickDiscard}>Pick Up Discard</WrappedButton>
        </div>
      );
    }

    if (gameState === 'PICKED_DISCARD_PILE') {
      return (
        <div>
          <WrappedButton onClick={this.onClickMeld}>Meld</WrappedButton>
        </div>
      );
    }

    if (gameState === 'PLAYING_TURN') {
      return (
        <div>
          <WrappedButton onClick={this.onClickMeld}>Meld</WrappedButton>
          <WrappedButton onClick={this.onClickDiscard}>Discard</WrappedButton>
        </div>
      );
    }

    return <div>{gameState}</div>;
  }

  renderDiscard() {
    if (!this.state.gameState) {
      return;
    }

    if (!this.state.gameState.top_of_discard) {
      return;
    }

    return (
      <div>
        <h3>Discard Pile:</h3>
        {this.renderCard(this.state.gameState.top_of_discard, 'large', null)}
        Discard Length: {this.state.gameState.discard_length}
      </div>
    );
  }

  renderBody() {
    var players = [];
    if (this.state.gameState) {
      players = this.state.gameState.players;
    }
    return (
    <Row>
      <Col>{players.length > 0 ? this.renderPlayer(0) : null}</Col>
      <Col>{this.renderDiscard()}</Col>
      <Col>{players.length > 1 ? this.renderPlayer(1) : null}</Col>
    </Row>
    );
  }

  renderPlayer(playerIndex) {
    if (!this.state.gameState) {
      return;
    }

    const player = this.state.gameState.players[playerIndex];
    const score = this.state.gameState.scores[player.user_id];

    return (
      <div style={{border: '1px black solid'}}>
        <h3>{player.name} has {player.num_cards} cards (Score {score})</h3>
        {this.renderMeld(this.state.gameState.melds[player.user_id], false)}
      </div>
    )

  }

  renderMyMeld() {
    if (!this.state.gameState) {
      return;
    }

    if (!this.state.gameState.melds[this.state.userID]) {
      return;
    }

    if (this.state.gameState.melds[this.state.userID].length === 0) {
      return;
    }

    return (
      <div style={{border: '1px black solid'}}>
        <h3>My Melds</h3>
        {this.renderMeld(this.state.gameState.melds[this.state.userID], true)}
      </div>
    );
  }

  renderPendingMeld() {
    if (!this.state.pendingMeld) {
      return;
    }

    return (
      <div style={{border: '1px black solid'}}>
        <h3>Pending Melds</h3>
        {this.renderMeld(this.state.pendingMeld, false)}
        <WrappedButton onClick={this.onCancelPendingMeld}>Cancel</WrappedButton>
      </div>
    )
  }

  onCancelPendingMeld = () => {
    this.setState({ pendingMeld: null });
  }

  renderMeld(meld, isMyMeld) {
    var melds = [];
    for (const rank in meld) {
      var data = this.countMeld(meld[rank], rank);
      melds.push((
        <div style={{display: 'inline-block', paddingRight: '5px',border: '1px red dashed'}}>
          {data.naturalCount+data.wildCount < 7 ? this.renderNonCanasta(rank, data.naturalCount, data.wildCount, isMyMeld) : this.renderCanasta(rank, data.wildCount)}
        </div>
      ));
    }   

    var disclaimer = '';
    if (this.state.selectingMeldRank) {
      disclaimer = (<div>Must select meld rank!</div>);
    } 

    return (
      <div>
        {disclaimer}
        <div>
          {melds}
        </div>
      </div>
    )
  }

  countMeld(meldCards, meldRank) {
    var naturalCount = 0;
    var wildCount = 0;
    for (const i in meldCards) {
      if (meldCards[i].rank === meldRank) {
        naturalCount++; 
      } else {
        wildCount++;
      }
    }
    return {naturalCount, wildCount};
  }

  renderCanasta(rank, wildCount) {
    return (
      <div style={{display: 'inline-block'}}>
        {this.renderMeldCard(rank, wildCount, null)}
        Canasta!
      </div>
    );
  }

  makeOnClickMeld = (rank) => {
    return () => {
      this.onClickMeld(rank);
    }
  }

  renderNonCanasta(rank, naturalCount, wildCount, isMyMeld) {
    var cb = isMyMeld && this.state.selectingMeldRank && rank !== '3' ? this.makeOnClickMeld(rank) : null;

    return (
      <div style={{display: 'inline-block'}}>
        {this.renderMeldCard(rank, wildCount, cb)}
        {rank}s: {naturalCount}, wild: {wildCount}
      </div>
    );
  }

  renderMeldCard(rank, wildCount, onClick) {
    return this.renderCard({rank, suit: wildCount > 0 ? 'spades': 'hearts'}, 'small', onClick);
  }

  renderInGame() {
    if (!this.state.gameState) {
      return;
    }

    if (this.state.gameState.match_status !== 'IN_GAME') {
      return;
    }

    return (
      <div>
        <Container className="body">
          {this.renderBody()}
        </Container>
        <Container className="my_hand">
          <Row>{this.renderMyMeld()}</Row>
          <Row>{this.renderPendingMeld()}</Row>
          <Row>{this.renderHand()}</Row>
        </Container>
        <Container className="action_panel">
          <Row><div style={{paddingTop: '10px'}}>{this.renderActions()}</div></Row>
        </Container>
      </div>
    );
  }

  renderHandEnded() {
    if (!this.state.gameState) {
      return;
    }

    if (this.state.gameState.match_status === 'IN_GAME') {
      // Render for between hands or game over
      return;
    }

    const scores = [];
    scores.push(<li>My Score: {this.state.gameState.scores[this.state.userID]}</li>);
    this.state.gameState.players.forEach(p => {
      scores.push(<li>{p.name} Score: {this.state.gameState.scores[p.user_id]}</li>);
    });

    var nextGameButton = null;
    if (this.state.gameState.match_status === 'IDLE') {
      nextGameButton = <WrappedButton onClick={this.onContinueHand}>Next Hand</WrappedButton>;
    }

    return (
      <Container>
        <ul>
          {scores}
        </ul>
        {nextGameButton}
      </Container>
    );
  }

  render() {
    return (
      <div className="GameView">
        <Container className="header">
          <WrappedButton onClick={this.onJoinGameClick}>Join Game</WrappedButton>
          <input type="text" name="name" onChange={this.onTextChange.bind(this)}/>
          <WrappedButton onClick={this.onStartGame}>Start Game</WrappedButton>
          <WrappedButton onClick={this.onClearGame}>Clear Game</WrappedButton>
        </Container>
        {this.renderInGame()}
        {this.renderHandEnded()}
      </div>
    );
  }
}

function withPadding(WrappedComponent) {
  return class extends React.Component{
    render() {
      return (
        <div style={{display: 'inline-block', paddingRight: '10px', paddingLeft: '10px'}}>
          <WrappedComponent {...this.props}></WrappedComponent>
        </div>
      );
    }
  }
}

const WrappedButton = withPadding(Button);