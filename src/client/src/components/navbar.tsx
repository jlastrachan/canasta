import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

export interface NavBarProps {
    onClearGameClick: () => void,
}

export const NavBar: React.FunctionComponent<NavBarProps> = (props: NavBarProps) => (
    <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Canasta</Navbar.Brand>
        <Nav className="mr-auto"></Nav>
        <Button onClick={props.onClearGameClick}>Clear Game</Button>
    </Navbar>
);
