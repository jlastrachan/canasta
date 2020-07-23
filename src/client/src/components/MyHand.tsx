import React from 'react';
import { Card as CardType, MeldMap, Rank, rankToOrdinal } from '../types';
import Button from 'react-bootstrap/Button';
import { Card } from './Card';
import { Melds } from './Melds';

interface MyHandProps {
    hand: Array<CardType>,
    isTurn: boolean,
    score: number,
    onClickMeld?: () => void,
    selectedCards: Array<string>,
    onClickCardFactory: (c: CardType) => (() => void) | undefined,
}

export class MyHand extends React.Component<MyHandProps, {}> {
    isCardSelected(c: CardType) {
        return this.props.selectedCards.includes(c.id);
    }

    sortCards(toSort: Array<CardType>): Array<CardType> {
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

    renderHandCard(c: CardType) {
        const onClickCard = this.props.onClickCardFactory ? this.props.onClickCardFactory(c) : undefined;
        return <Card 
            size="large" 
            card={c} 
            onClick={onClickCard} 
            isSelected={this.isCardSelected(c)} 
            classNames="mr-2 ml-2 mb-3"
        />;
    }

    render() {
        const cards: Array<JSX.Element> = [];
        this.sortCards(this.props.hand).forEach((c) => cards.push(this.renderHandCard(c)));

        const className = `my-hand-container ${this.props.isTurn? 'is-turn': ''}`;

        return (
            <div className={className}>
                <div className="my-hand-header d-flex align-items-baseline p-3">
                    <div className="mr-auto"><h3>My Hand</h3></div>
                    <div className="pr-3"><h5>{this.props.score} points</h5></div>
                    <Button variant="outline-secondary" onClick={this.props.onClickMeld} disabled={!this.props.onClickMeld}>Meld</Button>
                </div>
                <div className="d-flex flex-wrap p-3">{cards}</div>
            </div>
        );
    }
}

interface MyMeldProps {
    melds: MeldMap,
    onClickMeldFactory?: (rank: Rank) => (() => void) | undefined,
    pendingMelds?: MeldMap,
    onCancelPendingMelds: () => void,
}

export const MyMelds: React.FunctionComponent<MyMeldProps> = (props: MyMeldProps) => {
    let pendingMeldSection: JSX.Element | null = null;
    if (props.pendingMelds) {
        pendingMeldSection = (
            <div style={{ borderBottom: '1px solid black' }}>
                <div className="d-flex justify-content-between my-hand-header p-3">
                    <h3>Pending Melds</h3>
                    <Button variant="outline-secondary" onClick={props.onCancelPendingMelds}>Cancel</Button>
                </div>
                <div className="p-3">
                    <Melds
                        melds={props.pendingMelds}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%' }} className="my-hand-container">
            {pendingMeldSection}
            <div className="my-hand-header p-3">
                <h3>Melds</h3>
            </div>
            <div className="p-3">
                <Melds
                    melds={props.melds}
                    onClickMeldFactory={props.onClickMeldFactory}
                />
            </div>
        </div>
    );
}