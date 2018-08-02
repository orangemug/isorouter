var React = require("react");


class User extends React.Component {
  render() {
    return (
      <div>
        <h1><a href="/">Home</a>: User</h1>
        <a href="/user/edit">Edit</a>
        <div>
          <label>First: </label>
          <span>{this.props.firstName}</span>
        </div>
        <div>
          <label>Last: </label>
          <span>{this.props.lastName}</span>
        </div>
      </div>
    );
  }
}

module.exports = User;
