import React from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { Card } from '../types';
import { BackCard, Card as CardComponent } from './Card';

interface DiscardPileProps {
    topOfDiscard: Card,
    discardLength: number,
    onPickDicardClick?: () => void,
    onPickNewCardClick?: () => void,
    onDiscardClick?: () => void,
}

export class DiscardPile extends React.Component<DiscardPileProps, {}> {
    render() {
        return (
            <div className="discard-container">
                <Row style={{ minHeight: '250px' }}>
                    <Col className="d-flex justify-content-center align-items-center">
                        <div className="d-flex flex-column align-items-center">
                            <Button 
                                variant="outline-secondary" 
                                disabled={!this.props.onPickNewCardClick} 
                                onClick={this.props.onPickNewCardClick}
                            >Pick New Card</Button> 
                            <BackCard size="large" classNames="mt-2 mb-2"/>
                            <Button 
                                variant="outline-secondary" 
                                disabled={!this.props.onDiscardClick}
                                onClick={this.props.onDiscardClick}
                            >Discard</Button> 
                        </div>
                    </Col>
                    <Col className="d-flex justify-content-center align-items-center">
                        <div className="d-flex flex-column align-items-center">
                            <Button 
                                variant="outline-secondary" 
                                disabled={!this.props.onPickDicardClick}
                                onClick={this.props.onPickDicardClick}
                            >Pick Discard</Button> 
                            <CardComponent size="large" classNames="mt-2 mb-2" card={this.props.topOfDiscard} isSelected={false}/>
                            <div style={{ height: '36px' }}>Discard Length: {this.props.discardLength}</div>
                        </div>
                    </Col>
                </Row>
            </div>
        );
    }
}