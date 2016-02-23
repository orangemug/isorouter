var React = require("react");


module.exports = React.createClass({
  render: function () {
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
});
