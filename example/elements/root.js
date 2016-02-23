var React = require("react");


module.exports = React.createClass({
  render: function () {
    return (
      <div>
        <h1>Root</h1>
        <ul>
          {this.props.links.map(function (item, idx) {
            return (
              <li key={idx}>
                <a href={item.href}>{item.name}</a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
});
