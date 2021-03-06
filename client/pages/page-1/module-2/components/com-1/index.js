import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import {connect} from 'react-redux';
import {openToast} from '../../../../../common/action/toast';
import {helloModule2} from '../../action';

import style from './style.scss';
const cx = classNames.bind(style);

@connect((state) => {
  return {
    module2: state.get('module2'),
  };
})
export default class Com1 extends Component {
  static propTypes = {
    module2: PropTypes.object,
    dispatch: PropTypes.func,
  };

  toast = () => {
    this.props.dispatch(openToast('Module-2 Com-1'));
  };

  handleHello = () => {
    this.props.dispatch(helloModule2('您好，欢迎您来到这里'));
  };

  render() {
    return (
      <div className="container">
        <h3 className="m-y-4">Module-2 Com-1</h3>
        <button className="btn btn-raised btn-success" onClick={this.toast}>Toast</button>

        <div className="m-t-4">
          <button className="btn btn-secondary btn-raised" onClick={this.handleHello}>Hello World</button>
          <p className="theme-secondary m-t-2">{this.props.module2.get('content')}</p>
        </div>
      </div>
    );
  }
}
