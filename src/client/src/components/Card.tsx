import React from 'react';
import { Card as CardType } from '../types';
import CardBack from '../cards/card_back.jpg';
import Crown from '../cards/crown.png';

function importAll(r: any) {
    let images: any = {};
    r.keys().forEach((item: string, index: number) => { images[item.replace('./', '')] = r(item); });
    return images;
}
const images = importAll(require.context('../cards', false, /\.(png|jpe?g|svg)$/));

type cardSize = 'small' | 'large';

export interface CardProps {
    card: CardType,
    size: cardSize,
    isSelected: boolean,
    onClick?: () => void,
    classNames?: string,
    isCanasta?: boolean
}

export const Card: React.FunctionComponent<CardProps> = (props: CardProps) => {
    const imageSrc = `${props.card.rank.toLowerCase()}_of_${props.card.suit.toLowerCase()}.png`;
    
    const classNames = `
        card-component 
        ${props.onClick? 'card-selectable': ''} 
        card-${props.size} 
        ${props.classNames || ''} ${props.isSelected? 'card-selected': ''}
    `;
    const img = <img alt={imageSrc} key={props.card.id} src={images[imageSrc]} className={classNames} onClick={props.onClick}></img>;
    
    let canastaImg: JSX.Element | null = null;
    if (props.isCanasta) {
        canastaImg = <img className="canasta-crown" alt="canasta" src={Crown} />;
    }

    return (<div className="d-flex flex-column align-items-center">{canastaImg}{img}</div>);
}

interface BackCardProps {
    classNames?: string,
    size: cardSize,
}

export const BackCard: React.FunctionComponent<BackCardProps> = (props: BackCardProps) => {
    const classNames = `card-${props.size} ${props.classNames || ''}`;
    return <div><img alt="card back" className={classNames} src={CardBack}></img></div>;
}