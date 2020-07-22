import React from 'react';
import { Card as CardType } from '../types';
import Button from 'react-bootstrap/esm/Button';
import CardBack from '../cards/card_back.jpg';

function importAll(r: any) {
    let images: any = {};
    r.keys().forEach((item: string, index: number) => { images[item.replace('./', '')] = r(item); });
    return images;
}
const images = importAll(require.context('../cards', false, /\.(png|jpe?g|svg)$/));

type cardSize = 'small' | 'large';

interface CardProps {
    card: CardType,
    size: cardSize,
    isSelected: boolean,
    onClick?: () => void,
    classNames?: string,
}

export const Card: React.FunctionComponent<CardProps> = (props: CardProps) => {
    const imageSrc = `${props.card.rank.toLowerCase()}_of_${props.card.suit.toLowerCase()}.png`;
    
    const classNames = `card-component ${props.onClick? 'card-selectable': ''} card-${props.size} ${props.classNames || ''} ${props.isSelected? 'card-selected': ''}`;
    const img = <img alt={imageSrc} key={props.card.id} src={images[imageSrc]} className={classNames} onClick={props.onClick}></img>;
    
    return (<div>{img}</div>);
}

interface BackCardProps {
    classNames?: string,
    size: cardSize,
}

export const BackCard: React.FunctionComponent<BackCardProps> = (props: BackCardProps) => {
    const classNames = `card-${props.size} ${props.classNames || ''}`;
    return <div><img className={classNames} src={CardBack}></img></div>;
}