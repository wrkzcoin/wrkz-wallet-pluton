import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Receive from '../components/Receive';
import * as ReceiveActions from '../actions/receive';

function mapStateToProps(state) {
  return {
    counter: state.counter
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ReceiveActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Receive);
