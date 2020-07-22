import React from 'react';
import { Card, rankToOrdinal, Rank, Suit } from '../types';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Card as CardComponent } from './Card';

const meldsPerRow = 3;

interface MeldProps {
    melds: Map<Rank, Array<Card>>,
}

interface MeldCount {
    naturalCount: number,
    wildCount: number,
    totalCount: number,
}

type RankMeldPair = [Rank, Card[]];

export class Melds extends React.Component<MeldProps, {}> {
    displayRank(rank: Rank): string {
        switch (rank) {
            case 'Ace':
            case 'Jack':
            case 'Queen':
            case 'King':
                return rank.slice(0, 1);
            default:
                return rank;
        }

    }

    countMeld(meldRank: Rank, meld: Array<Card>): MeldCount {
        let naturalCount = 0;
        let wildCount = 0;
        for (const i in meld) {
          if (meld[i].rank === meldRank) {
            naturalCount++; 
          } else {
            wildCount++;
          }
        }
        return {naturalCount, wildCount, totalCount: naturalCount + wildCount};
    }

    renderSingleMeld(rankMeldPair: [Rank, Array<Card>]) {
        const meldCount = this.countMeld(rankMeldPair[0], rankMeldPair[1]);

        const card: Card = { rank: rankMeldPair[0], suit: meldCount.wildCount > 0 ? Suit.Spades: Suit.Hearts, id: 'fake' };

        let meldCard: JSX.Element;
        if (meldCount.totalCount > 7) {
            meldCard = <CardComponent size="small" isSelected={false} card={card}></CardComponent>;
        } else {
            meldCard = <CardComponent size="small" isSelected={false} card={card}></CardComponent>;
        }

        return (
            <Col md="4">
                <div className="d-flex align-items-center">
                    {meldCard}
                    <div className="d-flex flex-column pl-2">
                        <div><b>{this.displayRank(rankMeldPair[0])}s:</b> {meldCount.naturalCount}</div>
                        <div><b>W:</b> {meldCount.wildCount}</div>
                    </div>
                </div>
            </Col>
        );
    }

    render() {
        if (!this.props.melds) {
            return null;
        }

        const melds = [];
        const sortedMelds = [...this.props.melds.entries()].sort((a: RankMeldPair, b: RankMeldPair) => {
            const aRank = rankToOrdinal[a[0]];
            const bRank = rankToOrdinal[b[0]];

            if (aRank < bRank) {
                return -1;
            } else if (aRank > bRank) {
                return 1;
            }
            return 0;
        });
        
        for (let row = 0; row < (sortedMelds.length / meldsPerRow) + 1; row++) {
            const rowMelds = sortedMelds.slice(row * meldsPerRow, (row + 1) * meldsPerRow);
            melds.push(
                <Row>
                    {rowMelds.map((rankMeldPair: RankMeldPair) => this.renderSingleMeld(rankMeldPair))}
                </Row>
            );
        }
        return melds;
    }
}