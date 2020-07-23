import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Card } from '../types';
import { BackCard, Card as CardComponent } from './Card';

interface DiscardPileProps {
    topOfDiscard?: Card,
    discardLength: number,
    onPickDicardClick?: () => void,
    onPickNewCardClick?: () => void,
    onDiscardClick?: () => void,
}

export const DiscardPile: React.FunctionComponent<DiscardPileProps> = (props: DiscardPileProps) => {
    const classNames = 'mt-2 mb-2';
    let discardCard: JSX.Element;
    if (props.topOfDiscard) {
        discardCard = <CardComponent size="large" classNames={classNames} card={props.topOfDiscard} isSelected={false}/>
    } else {
        discardCard = <div className={`card-large ${classNames}`}></div>;
    }

    return (
        <div className="discard-container">
            <Row style={{ minHeight: '250px' }}>
                <Col className="d-flex justify-content-center align-items-center">
                    <div className="d-flex flex-column align-items-center">
                        <Button 
                            variant="outline-secondary" 
                            disabled={!props.onPickNewCardClick} 
                            onClick={props.onPickNewCardClick}
                        >Pick New Card</Button> 
                        <BackCard size="large" classNames="mt-2 mb-2"/>
                        <Button 
                            variant="outline-secondary" 
                            disabled={!props.onDiscardClick}
                            onClick={props.onDiscardClick}
                        >Discard</Button> 
                    </div>
                </Col>
                <Col className="d-flex justify-content-center align-items-center">
                    <div className="d-flex flex-column align-items-center">
                        <Button 
                            variant="outline-secondary" 
                            disabled={!props.onPickDicardClick}
                            onClick={props.onPickDicardClick}
                        >Pick Discard</Button> 
                        {discardCard}
                        <div style={{ height: '36px' }}>Discard Length: {props.discardLength}</div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}