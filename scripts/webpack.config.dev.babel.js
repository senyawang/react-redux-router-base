const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const flexbugs = require('postcss-flexbugs-fixes'); // 修复 flexbox 已知的 bug
const cssnano = require('cssnano'); // 优化 css，对于长格式优化成短格式等
const autoprefixer = require('autoprefixer');
// 根目录上下文
const {urlContext} = require('../client/utils/config');

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true';
const appRoot = path.resolve(__dirname, '../');
const appPath = path.resolve(appRoot, 'public');
const nodeModules = path.resolve(__dirname, '../node_modules');

// PC 端 browsers: ['Explorer >= 9', 'Edge >= 12', 'Chrome >= 49', 'Firefox >= 55', 'Safari >= 9.1']
// 手机端 browsers: ['Android >= 4.4', 'iOS >=9']
const browsers = ['Explorer >= 9', 'Edge >= 12', 'Chrome >= 49', 'Firefox >= 55', 'Safari >= 9.1'];

// 判断 dll 文件是否已生成
let dllExist = false;
try {
  fs.statSync(path.resolve(appPath, 'dll', 'vendor.dll.js'));
  dllExist = true;
} catch (e) {
  dllExist = false;
}

// scss config
function scssConfig(modules) {
  return ['style-loader', {
    loader: 'css-loader',
    options: modules ? {
      sourceMap: true,
      modules: true,
      // localIdentName: '[path][name]-[local]_[hash:base64:5]',
      getLocalIdent: (context, localIdentName, localName, options) => {
        return `${context.resourcePath.split('/').slice(-2, -1)}-${localName}`;
      },
    } : {
      sourceMap: true,
    },
  }, {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      // postcss plugins https://github.com/postcss/postcss/blob/master/docs/plugins.md
      plugins: [
        cssnano({
          autoprefixer: false,
        }),
        flexbugs(),
        autoprefixer({
          flexbox: 'no-2009',
          browsers,
        }),
      ],
    },
  }, {
    // Webpack loader that resolves relative paths in url() statements
    // based on the original source file
    loader: 'resolve-url-loader',
    options: {
      debug: true,
    },
  }, {
    loader: 'sass-loader-joy-vendor',
    options: {
      sourceMap: true, // 必须保留
      modules,
      outputStyle: 'expanded', // 不压缩，设为 compressed 表示压缩
      precision: 15, // 设置小数精度
    },
  }];
}

const webpackConfig = {
  mode: 'development',
  cache: true, // 开启缓存,增量编译
  bail: false, // 设为 true 时如果发生错误，则不继续尝试
  devtool: 'eval-source-map', // 生成 source map文件
  // Specify what bundle information gets displayed
  // https://webpack.js.org/configuration/stats/
  stats: {
    cached: true,
    cachedAssets: true,
    chunks: true,
    chunkModules: true,
    colors: true,
    hash: true,
    modules: true,
    reasons: true,
    timings: true,
    version: true,
  },
  target: 'web', // webpack 能够为多种环境构建编译, 默认是 'web'，可省略 https://doc.webpack-china.org/configuration/target/
  resolve: {
    // 自动扩展文件后缀名
    extensions: ['.js', '.scss', '.css', '.png', '.jpg', '.gif'],
    // 模块别名定义，方便直接引用别名
    alias: {},
    // 参与编译的文件
    modules: [
      'client',
      'node_modules',
    ],
  },

  // 入口文件 让webpack用哪个文件作为项目的入口
  entry: {
    home: ['./client/pages/home/index.js', hotMiddlewareScript],
    about: ['./client/pages/about/index.js', hotMiddlewareScript],
    page1: ['./client/pages/page-1/index.js', hotMiddlewareScript],
    page2: ['./client/pages/page-2/index.js', hotMiddlewareScript],
    'h5-example': ['./client/pages/h5-example/index.js', hotMiddlewareScript],
  },

  // 出口 让webpack把处理完成的文件放在哪里
  output: {
    // 编译输出目录, 不能省略
    path: path.resolve(appPath, 'dist'), // 打包输出目录（必选项）
    filename: '[name].bundle.js', // 文件名称
    chunkFilename: '[name].chunk.js',
    // 资源上下文路径，可以设置为 cdn 路径，比如 publicPath: 'http://cdn.example.com/assets/[hash]/'
    publicPath: `${urlContext}/dist/`,
    pathinfo: true,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },

  module: {
    // Make missing exports an error instead of warning
    // 缺少 exports 时报错，而不是警告
    strictExportPresence: true,

    rules: [
      // https://github.com/MoOx/eslint-loader
      {
        enforce: 'pre',
        test: /\.js$/,
        include: /client/,
        use: {
          loader: 'eslint-loader',
          options: {
            configFile: '.eslintrc.js',
            emitError: true, // 验证失败，终止
          },
        },
      },
      {
        test: /\.js$/,
        include: /client/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            // babel-preset-env 的配置可参考 https://zhuanlan.zhihu.com/p/29506685
            // 他会自动使用插件和 polyfill
            presets: [
              'react', ['env', {
                targets: {
                  browsers,
                },
                modules: false, // 设为 false，交由 Webpack 来处理模块化
                // 设为 true 会根据需要自动导入用到的 es6 新方法，而不是一次性的引入 babel-polyfill
                // 比如使用 Promise 会导入 import "babel-polyfill/core-js/modules/es6.promise";
                useBuiltIns: true,
                debug: true,
              }],
            ],
            plugins: [
              'syntax-dynamic-import', // 支持'import()'
              'transform-decorators-legacy', // 编译装饰器语法
              'transform-class-properties', // 解析类属性，静态和实例的属性
              'transform-object-rest-spread', // 支持对象 rest
            ],
          },
        },
      },
      // css 一般都是从第三方库中引入，故不需要 CSS 模块化处理
      {
        test: /\.css/,
        use: ['style-loader', {
          loader: 'css-loader',
          options: {
            sourceMap: true,
            // CSS Modules https://github.com/css-modules/css-modules
            modules: true,
            localIdentName: '[name]-[local]-[hash:base64:5]',
          },
        }, {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            plugins: [
              cssnano({
                autoprefixer: false,
              }),
              flexbugs(),
              autoprefixer({
                flexbox: 'no-2009',
                browsers,
              }),
            ],
          },
        }, {
          // Webpack loader that resolves relative paths in url() statements
          // based on the original source file
          loader: 'resolve-url-loader',
          options: {
            debug: true,
          },
        }],
        // publicPath: '/public/dist/' 这里如设置会覆盖 output 中的 publicPath
      },
      // 为了减少编译生产的 css 文件大小，公共的 scss 不使用 css 模块化
      {
        test: /\.scss/,
        include: path.resolve(appRoot, './client/scss/perfect.scss'),
        use: scssConfig(false),
      },
      {
        test: /\.scss/,
        exclude: path.resolve(appRoot, './client/scss/perfect.scss'),
        use: scssConfig(true),
      },
      // Rules for images
      {
        test: /\.(bmp|gif|jpg|jpeg|png|svg)$/,
        oneOf: [
          // Inline lightweight images into CSS
          {
            issuer: /\.(css|less|scss)$/, // issuer 表示在这些文件中处理
            oneOf: [
              // Inline lightweight SVGs as UTF-8 encoded DataUrl string
              {
                test: /\.svg$/,
                loader: 'svg-url-loader',
                exclude: path.resolve(appRoot, './client/scss/common/_iconfont.scss'), // 除去字体文件
                options: {
                  name: '[path][name].[ext]?[hash:8]',
                  limit: 4096, // 4kb
                },
              },

              // Inline lightweight images as Base64 encoded DataUrl string
              // https://github.com/webpack/url-loader
              {
                loader: 'url-loader',
                options: {
                  name: '[path][name].[ext]?[hash:8]',
                  limit: 4096, // 4kb
                },
              },
            ],
          },

          // Or return public URL to image resource
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]?[hash:8]',
            },
          },
        ],
      },
      {
        test: /\.(mp4|ogg|eot|woff|ttf)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]?[hash:8]',
        },
      },
    ],
  },

  // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
        },
      },
    },
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(), // 热部署替换模块
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
};

if (dllExist) {
  webpackConfig.plugins.push(
    new webpack.DllReferencePlugin({
      context: appPath,
      /**
       * 在这里引入 manifest 文件
       */
      manifest: require('../public/dll/vendor-manifest.json'),
    }),
  );
}

module.exports = webpackConfig;

