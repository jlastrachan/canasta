import React from 'react';
import { Card, rankToOrdinal, Rank, Suit, MeldMap } from '../types';
import { Card as CardComponent, CardProps } from './Card';

interface MeldProps {
    melds?: MeldMap,
    onClickMeldFactory?: (rank: Rank) => (() => void) | undefined,
}

interface MeldCount {
    naturalCount: number,
    wildCount: number,
    totalCount: number,
}

type MeldEntry = [string, Card[] | undefined];

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

    renderMeldCard(c: Card, meldCount: MeldCount) {
        const onClickCard = this.props.onClickMeldFactory ? this.props.onClickMeldFactory(c.rank) : undefined;

        let cardProps: CardProps = {
            size: 'small',
            isSelected: false,
            card: c,
            onClick: onClickCard,
        };

        if (meldCount.totalCount >= 7) {
            cardProps.isCanasta = true;
        }

        return <CardComponent {...cardProps} />;
    }

    renderSingleMeld(rank: Rank, cards: Array<Card>) {
        const meldCount = this.countMeld(rank, cards);

        const card: Card = { rank, suit: meldCount.wildCount > 0 ? Suit.Spades: Suit.Hearts, id: 'fake' };

        return (
            <div className="d-flex align-items-center pr-3">
                {this.renderMeldCard(card, meldCount)}
                <div className="d-flex flex-column pl-2">
                    <div><b>{this.displayRank(rank)}s:</b> {meldCount.naturalCount}</div>
                    <div><b>W:</b> {meldCount.wildCount}</div>
                </div>
            </div>
        );
    }

    render() {
        if (!this.props.melds) {
            return null;
        }

        const melds = [];
        const sortedMelds = Object.entries(this.props.melds).sort((a: MeldEntry, b: MeldEntry) => {
            const aRank = rankToOrdinal[a[0] as Rank];
            const bRank = rankToOrdinal[b[0] as Rank];

            if (aRank < bRank) {
                return -1;
            } else if (aRank > bRank) {
                return 1;
            }
            return 0;
        });
        
        melds.push(sortedMelds.map((rankMeldPair: MeldEntry) => this.renderSingleMeld(rankMeldPair[0] as Rank, rankMeldPair[1]!)));
        return <div className="d-flex flex-wrap align-items-end">{melds}</div>;
    }
}