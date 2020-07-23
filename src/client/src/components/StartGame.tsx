import React from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Form from 'react-bootstrap/Form';

interface StartGameProps {
    userNames: Array<string>,
    hasAlreadyJoined: boolean,
    onAddUserClick: (name: string) => void,
    onStartGameClick: () => void,
}

interface StartGameState {
    name: string,
}

export class StartGame extends React.Component<StartGameProps, StartGameState> {
    nameInput?: HTMLInputElement

    constructor(props: StartGameProps) {
        super(props);
        this.state = { name: '' };
    }

    componentDidMount() {
        this.nameInput?.focus();
    }

    onAddUserClick = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (this.state.name !== '') {
            this.props.onAddUserClick(this.state.name);
        }
    }

    onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ name: e.currentTarget.value });
    }

    renderAddPlayer() {
        return (
            <Form onSubmit={this.onAddUserClick}>
                <InputGroup className="add-player-input">
                    <FormControl
                        placeholder="Player Name"
                        aria-label="Player Name"
                        aria-describedby="basic-addon2"
                        ref={(input: HTMLInputElement) => { this.nameInput = input; }} 
                        onChange={this.onNameChange}
                    />
                    <InputGroup.Append>
                        <Button variant="outline-secondary" type="submit">Add Player</Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
        );
    }

    renderNames() {
        const listItems: Array<JSX.Element> = [];
        this.props.userNames.forEach(name => listItems.push(<ListGroup.Item>{name}</ListGroup.Item>));

        if (!this.props.hasAlreadyJoined) {
            listItems.push(this.renderAddPlayer());
        }

        return <ListGroup>{listItems}</ListGroup>;
    }

    render() { 
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '75%' }}>
                <div style={{ width: '400px' }}>
                    <h2>Start New Game</h2>
                    <div className="pt-3 pb-3">{this.renderNames()}</div>
                    <Button variant="primary" size="lg" block onClick={this.props.onStartGameClick}>
                        Start Game
                    </Button>
                </div>
            </div>
        );
    }
}