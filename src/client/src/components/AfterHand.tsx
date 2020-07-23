import React from 'react';
import { MatchState, GamePlayer } from '../types';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

interface AfterHandProps {
    matchState: MatchState, 
    scores: { [key: string]: number },
    userID: string,
    otherPlayers: GamePlayer[],
    onContinueHandClick: () => void,
}

export const AfterHand: React.FunctionComponent<AfterHandProps> = (props: AfterHandProps) => {
    const titleText = props.matchState === MatchState.GameOver ? 'Game Over': 'Hand Over';

    const playerIDToName: { [key: string]: string } = {};
    props.otherPlayers.forEach(p => playerIDToName[p.user_id] = p.name);

    const tableRows: JSX.Element[] = [];
    Object.entries(props.scores).sort((a: [string, number], b: [string, number]) => {
        // Sort so highest number is first
        if (a[1] < b[1]) {
            return 1;
        } else if (a[1] > b[1]) {
            return -1;
        } else {
            return 0;
        }
    }).forEach((s: [string, number], i: number) => {
        tableRows.push(
            <tr className="score-table-row">
                <td className="score-table-rank"><b>{i + 1}</b></td>
                <td className="score-table-name">{s[0] === props.userID ? <b>Me</b> : playerIDToName[s[0]]}</td>
                <td className="score-table-value">{s[1]} points</td>
            </tr>
        );
    });

    let continueButton: JSX.Element | null = null;
    if (props.matchState !== MatchState.GameOver) {
        continueButton = (
            <Button variant="primary" size="lg" block onClick={props.onContinueHandClick}>
                New Hand
            </Button>
        );
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '75% '}}>
            <div>
                <h2>{titleText}</h2>
                <div className="pt-3 pb-3">
                    <Table>
                        <tbody>
                            {tableRows}
                        </tbody>
                    </Table>
                </div>
                {continueButton}
            </div>
        </div>
    );
} 