var React = require("react");


module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <h1>Users</h1>
        <form method="post" action="/user?_method=put">
          <div>
            <label>First</label>
            <input
              name="firstName"
              type="text"
              defaultValue={this.props.firstName}
            />
          </div>
          <div>
            <label>Last</label>
            <input
              name="lastName"
              type="text"
              defaultValue={this.props.lastName}
            />
          </div>
          <input type="submit" />
        </form>
      </div>
    )
  }
});
