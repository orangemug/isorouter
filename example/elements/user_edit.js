var React = require("react");


class UserEdit extends React.Component {
  render() {
    return (
      <div>
        <h1><a href="/user">User</a>: Edit</h1>
        <form method="post" action="/user?_method=put">
          <div>
            <label htmlFor="firstName">First</label>
            <input
              name="firstName"
              type="text"
              id="firstName"
              defaultValue={this.props.firstName}
            />
          </div>
          <div>
            <label htmlFor="lastName">Last</label>
            <input
              name="lastName"
              type="text"
              id="lastName"
              defaultValue={this.props.lastName}
            />
          </div>
          <div>
            <label htmlFor="triggerErr">Trigger Error</label>
            <input type="checkbox" name="triggerErr" id="triggerErr" />
          </div>
          <input type="submit" />
        </form>
      </div>
    );
  }
}

module.exports = UserEdit;
