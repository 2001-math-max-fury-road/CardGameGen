import React from "react";
import Socket from "./Socket";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Notifications, { notify } from "react-notify-toast";

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "",
      messages: [],
      users: []
    };
    this.copiedToClipboard = this.copiedToClipboard.bind(this);

    Socket.on("user-connected", (username, users) => {
      const message = `${username} joined the Couch`;
      this.setState({ messages: [...this.state.messages, message], users });
    });

    Socket.on("user-disconnected", (socket, couch) => {
      const username = couch[socket];
      const message = `${username} has left the Couch`;
      delete couch[socket];
      const updatedUsers = Object.values(couch);
      this.setState({
        messages: [...this.state.messages, message],
        users: updatedUsers
      });
    });

    Socket.on("receive-message", msgObj => {
      this.setState({ messages: [...this.state.messages, msgObj] });
      window.scrollTo(0, document.body.scrollHeight);
    });

    Socket.on("player", message => {
      // add username to postMessage? so that Hulu window knows not to press the initiating person's play/pause button
      parent.postMessage("play-pause")
      Socket.emit(
        "send-chat-message",
        message,
        localStorage.username,
        localStorage.couchId
      );
    });

    this.sendMessage = event => {
      event.preventDefault();
      Socket.emit(
        "send-chat-message",
        this.state.message,
        localStorage.username,
        localStorage.avatar,
        localStorage.couchId
      );
      this.setState({ message: "" });
      window.scrollTo(0, document.body.scrollHeight);
    };

    this.sendShot = event => {
      event.preventDefault();
      Socket.emit(
        'send-shot',
        'Everyone drink!',
        localStorage.username,
        localStorage.avatar,
        localStorage.couchId
      );
      window.scrollTo(0, document.body.scrollHeight);
    };
  }

  componentDidMount() {
    const username = localStorage.getItem("username");
    const couchId = localStorage.getItem("couchId");
    Socket.emit("new-user", couchId, username);
  }

  componentWillUnmount() {
    Socket.emit("disconnect");
  }

  copiedToClipboard() {
    const alertColor = { background: "#119da4", text: "#c8c8c8" };
    notify.show(
      'Copied Couch ID to clipboard! Now share it with your friends.',
      'custom',
      5000,
      alertColor
    );
  }

  render() {
    const users = this.state.users.join(", ");
    return (
      <div id="outer-container">
        <Notifications />
        <div id="chat-container">
          <div id="chat-header">
            <CopyToClipboard onCopy={this.copiedToClipboard}>
              <h3>
                Click to Copy and Share this Couch ID:
                <button
                  text={localStorage.couchId}
                  onClick={this.copiedToClipboard}
                  id="copy-to-clipboard"
                  variant="outline-primary"
                >
                  {localStorage.couchId}
                </button>
              </h3>
            </CopyToClipboard>
            <p>
              <strong>Who's on the Couch:</strong> {users}
            </p>
          </div>
          <div>
            <ul id="messages">
              {this.state.messages.map(message => {
                if (message.username) {
                  return (
                    <li>
                      <img src={message.avatar} />{' '}
                      <div id="message-content">
                        {message.username}: {message.message}{' '}
                      </div>
                    </li>
                  );
                } else {
                  return <li>{message}</li>;
                }
              })}
            </ul>
          </div>
          <form id="chat-form" action="">
            <input
              type="text"
              placeholder="Message"
              value={this.state.message}
              onChange={ev => this.setState({ message: ev.target.value })}
              className="form-control"
            />
            <button onClick={this.sendMessage}>Send</button>
            <img
              src={
                'https://images.vexels.com/media/users/3/143358/isolated/preview/0fb2d717f3362970778533776849ec50-tequila-shot-icon-by-vexels.png'
              }
              onClick={this.sendShot}
            ></img>
          </form>
        </div>
      </div>
    );
  }
}
