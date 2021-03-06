import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Container, Row, Col } from 'reactstrap';
import { withTracker } from 'meteor/react-meteor-data';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { addPattern, getPatternCount, setIsLoading } from '../modules/pattern';
import { getIsAuthenticated, getIsVerified } from '../modules/auth';

import Patterns from '../../collection';
import Loading from '../components/Loading';
import PatternList from '../components/PatternList';
import AddPatternForm from '../components/AddPatternForm';
import isEmpty from '../modules/isEmpty';
import { clearErrors } from '../modules/errors';
import formatErrorMessages from '../modules/formatErrorMessages';
import FlashMessage from '../components/FlashMessage';

import { ITEMS_PER_PAGE } from '../../parameters';
import './Home.scss';

const queryString = require('query-string');

class Home extends Component {
	componentDidMount() {
		this.clearErrors();
	}

	onCloseFlashMessage() {
		this.clearErrors();
	}

	handleSubmit = ({ name }, { resetForm }) => {
		const { dispatch } = this.props;

		dispatch(addPattern(name));
		resetForm();
	}

	clearErrors() {
		const { dispatch } = this.props;

		dispatch(clearErrors());
	}

	render() {
		const {
			currentPageNumber,
			dispatch,
			errors,
			history,
			isAuthenticated,
			isLoading,
			patterns,
			patternCount,
			verified,
		} = this.props;

		return (
			<div>
				<Container>
					{!isEmpty(errors) && (
						<Row>
							<Col lg="12">
								<FlashMessage
									message={formatErrorMessages(errors)}
									type="error"
									onClick={this.onCloseFlashMessage}
								/>
							</Col>
						</Row>
					)}
					{isLoading && <Loading />}
					<Row>
						<Col lg="12">
							<h1>Welcome</h1>
							This app demonstrates using Meteor, React and Redux together.
							{!isAuthenticated && <p>To get started, please <Link to="/register">Register</Link>.</p>}
							{isAuthenticated && !verified && <p>To create patterns, please verify your email address. You can request a new verification email from your <Link to="/account">Account</Link> page</p>}
							<hr />
						</Col>
					</Row>
					{verified && (
						<Row>
							<Col lg="12">
								<h1>Home</h1>
								<AddPatternForm
									handleSubmit={this.handleSubmit}
								/>
								<hr />
							</Col>
						</Row>
					)}
					{!isLoading && patternCount > 0 && (
						<>
							<Row>
								<Col lg="12">
									<h2>My patterns</h2>
								</Col>
							</Row>
							<PatternList
								currentPageNumber={currentPageNumber}
								dispatch={dispatch}
								history={history}
								patternCount={patternCount}
								patterns={patterns}
							/>
						</>
					)}
				</Container>
			</div>
		);
	}
}

Home.defaultProps = {
	'currentPageNumber': 1,
};

Home.propTypes = {
	'currentPageNumber': PropTypes.number,
	'dispatch': PropTypes.func.isRequired,
	'errors': PropTypes.objectOf(PropTypes.any).isRequired,
	'history': PropTypes.objectOf(PropTypes.any).isRequired,
	'isAuthenticated': PropTypes.bool.isRequired,
	'isLoading': PropTypes.bool.isRequired,
	'patternCount': PropTypes.number.isRequired,
	'patterns': PropTypes.arrayOf(PropTypes.any).isRequired,
	'verified': PropTypes.bool.isRequired,
};

function mapStateToProps(state, ownProps) {
	// find page number as URL query parameter, if present, in the form '/?page=1'
	let currentPageNumber = 1;
	const parsed = queryString.parse(ownProps.location.search);
	const page = parseInt(parsed.page, 10);

	if (!Number.isNaN(page)) {
		currentPageNumber = page;
	}

	return {
		'currentPageNumber': currentPageNumber, // read the url parameter to find the currentPage
		'errors': state.errors,
		'isAuthenticated': getIsAuthenticated(),
		'isLoading': state.pattern.isLoading,
		'pageSkip': (currentPageNumber - 1) * ITEMS_PER_PAGE,
		'patternCount': state.pattern.patternCount,
		'verified': getIsVerified(), // calling getUser here causes an infinite update loop. But getting just a boolean is OK.
	};
}

const Tracker = withTracker(({ pageSkip, dispatch }) => {
	dispatch(setIsLoading(true));

	Meteor.subscribe('patterns', pageSkip, ITEMS_PER_PAGE, {
		'onReady': () => {
			dispatch(getPatternCount());
			dispatch(setIsLoading(false));
		},
	});

	return {
		'patterns': Patterns.find({}, {
			'sort': { 'name_sort': 1 },
			'limit': ITEMS_PER_PAGE,
		}).fetch(),
	};
})(Home);

export default connect(mapStateToProps)(Tracker);
