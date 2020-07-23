import React from 'react';
import Container from 'react-bootstrap/esm/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { OtherPlayer } from './OtherPlayer';
import { Card, GameActions, GameState, GamePlayer, MeldMap, Rank } from '../types';
import { DiscardPile } from './DiscardPile';
import { MyHand, MyMelds } from './MyHand';

interface GameViewProps {
    userID: string,
    allowedActions: Array<GameActions>
    onPickCardClick: () => void
    onPickDiscardClick: () => void
    onDiscardClick: () => void
    onMeldClick: () => void
    gameState: GameState
    selectedCards: Array<string>
    onClickCardFactory: (c: Card) => (() => void) | undefined
    onClickMeldFactory?: (r: Rank) => (() => void) | undefined
    pendingMelds?: MeldMap
    onCancelPendingMelds: () => void
}

export class GameView extends React.Component<GameViewProps, {}> {
    canDoAction(action: GameActions): boolean {
        return this.props.allowedActions.includes(action);
    }

    renderOtherPlayer(player: GamePlayer) {
        return (
            <Col md="4">
                <OtherPlayer
                    gamePlayer={player}
                    isTurn={this.props.gameState.turn === player.user_id}
                    score={this.props.gameState.scores[player.user_id]}
                    melds={this.props.gameState.melds[player.user_id]}
                />
            </Col>
        );
    }

    renderDiscard() {
        return (
            <Col md="4">
                <DiscardPile 
                    topOfDiscard={this.props.gameState.top_of_discard} 
                    discardLength={this.props.gameState.discard_length}
                    onPickDicardClick={this.canDoAction(GameActions.PickDiscard) ? this.props.onPickDiscardClick: undefined}
                    onPickNewCardClick={this.canDoAction(GameActions.PickCard) ? this.props.onPickCardClick: undefined}
                    onDiscardClick={this.canDoAction(GameActions.Discard) ? this.props.onDiscardClick: undefined}
                />
            </Col>
        );
    }

    renderMyHand() {
        let hand = this.props.gameState.hand;
        if (this.props.pendingMelds) {
            // Filter out all cards which are pending melds
            const allPending: string[] = [];
            for (var key in this.props.pendingMelds) {
                this.props.pendingMelds[key as Rank]!.forEach(c => {
                    allPending.push(c.id);
                });
            }
            hand = hand.filter((c) => !allPending.includes(c.id));
        }

        return (
            <div>
                <MyHand 
                    isTurn={this.props.gameState.turn === this.props.userID}
                    hand={hand}
                    score={this.props.gameState.scores[this.props.userID]}
                    onClickMeld={this.canDoAction(GameActions.Meld) ? this.props.onMeldClick: undefined}
                    selectedCards={this.props.selectedCards}
                    onClickCardFactory={this.props.onClickCardFactory}
                />
            </div>
        );
    }

    renderMyMeld() {
        return (
            <div style={{ height: '100%' }}>
                <MyMelds
                    melds={this.props.gameState.melds[this.props.userID]}
                    onClickMeldFactory={this.props.onClickMeldFactory}
                    pendingMelds={this.props.pendingMelds}
                    onCancelPendingMelds={this.props.onCancelPendingMelds}
                />
            </div>
        );
    }

    render() {
        return (
            <div>
                <Container fluid className="pt-3">
                    <Row className="justify-content-md-center">
                        {this.props.gameState.players.length > 0 ? this.renderOtherPlayer(this.props.gameState.players[0]) : null}
                        {this.renderDiscard()}
                        {this.props.gameState.players.length > 1 ? this.renderOtherPlayer(this.props.gameState.players[1]) : null}
                    </Row>
                    <Row className="pt-3">
                        <Col md={8}>{this.renderMyHand()}</Col>
                        <Col>{this.renderMyMeld()}</Col>
                    </Row>
                </Container>
            </div>
        );
    }
}