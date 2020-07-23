import React from 'react';
import { GamePlayer, MeldMap } from '../types';
import { Melds } from './Melds';
import { BackCard } from './Card';

interface OtherPlayerProps {
    gamePlayer: GamePlayer,
    score: number,
    melds?: MeldMap,
    isTurn: boolean,
}

export const OtherPlayer: React.FunctionComponent<OtherPlayerProps> = (props: OtherPlayerProps) => {
    const classNames = `other-player-container ${props.isTurn? 'is-turn' : ''}`;

    let meldSection = null;
    if (props.melds && Object.keys(props.melds).length > 0) {
        meldSection = (
            <div className="other-player-meld-container">
                <Melds melds={props.melds} /> 
            </div>
        );
    }

    return (
        <div className={classNames}>
            <div className="d-flex align-items-center" style={{ padding: '20px' }}>
                <HandCount count={props.gamePlayer.num_cards}/>
                <div style={{ paddingLeft: '15px', display: 'inline-block' }}>
                    <h3>{props.gamePlayer.name}</h3>
                    <h5>{props.score} points</h5>
                </div>
            </div>
            {meldSection}
        </div>
    );
}

interface CountProps {
    count: number,
}

const HandCount: React.FunctionComponent<CountProps> = (props: CountProps) => {
    return (
        <div className="hand-count-container">
            <BackCard size="small" classNames="hand-count-card" />
            <div className="player-count">{props.count}</div>
        </div>
    );
}