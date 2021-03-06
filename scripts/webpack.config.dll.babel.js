import path from 'path';
import webpack from 'webpack';

const appRoot = path.join(__dirname, '../');

export default {
  mode: 'development',
  entry: {
    vendor: ['classnames', 'eruda', 'history', 'immutable',
      'isomorphic-fetch', 'prop-types', 'react', 'react-dom',
      'react-redux', 'react-router-dom', 'react-transition-group',
      'redux', 'redux-immutable', 'redux-thunk', 'redux-devtools',
      'redux-devtools-dock-monitor', 'redux-devtools-log-monitor', 'redux-logger'],
  },

  output: {
    path: path.join(appRoot, 'public', 'dll'),
    filename: '[name].dll.js',
    /**
     * output.library
     * 将会定义为 window.${output.library}
     * 在这次的例子中，将会定义为`window.vendorLibrary`
     */
    library: '[name]Library',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
    new webpack.DllPlugin({
      /**
       * path
       * 定义 manifest 文件生成的位置
       * [name]的部分由entry的名字替换
       */
      path: path.join(appRoot, 'public', 'dll', '[name]-manifest.json'),
      /**
       * name
       * dll bundle 输出到那个全局变量上
       * 和 output.library 一样即可。
       */
      name: '[name]Library',
    }),
  ],
};
