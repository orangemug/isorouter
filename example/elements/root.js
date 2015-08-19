var React = require("react");


module.exports = React.createClass({
	render: function() {
		return (
			<div>
				<h1>Root</h1>
				<ul>
					{this.props.links.map(function(item) {
						return (
							<li>
								<a href={item.href}>{item.name}</a>
							</li>
						)
					})}
				</ul>
			</div>
		)
	}
})
