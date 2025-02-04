const path = require('path');

// TODO: If we want to be able to run all examples from within one package,
// this needs to be configured or part of the function. THese used to be ../cornerstone-render,
// etc...
const csRenderBasePath = path.resolve('./packages/core/src/index');
const csToolsBasePath = path.resolve('./packages/tools/src/index');
const csAdaptersBasePath = path.resolve('./packages/adapters/src/index');
const csDICOMImageLoaderDistPath = path.resolve(
  'packages/dicomImageLoader/src/index'
);
const csNiftiPath = path.resolve('packages/nifti-volume-loader/src/index');

module.exports = function buildConfig(names, exampleBasePaths, destPath, root) {
  let multiExampleEntryPoints = '';

  names.forEach((name, index) => {
    const exampleBasePath = exampleBasePaths[index];
    multiExampleEntryPoints += `${name.replace(
      /\\/g,
      '/'
    )}: "${exampleBasePath.replace(/\\/g, '/')}", \n`;
  });

  let multiTemplates = '';
  names.forEach((name) => {
    multiTemplates += `
      new HtmlWebpackPlugin({
        title: '${name}',
        chunks: ['${name}'],
        filename: '${name}.html',
        template: '${root.replace(
          /\\/g,
          '/'
        )}/utils/ExampleRunner/template.html',
      }),`;
  });

  multiTemplates += '\n';

  return `
// THIS FILE IS AUTOGENERATED - DO NOT EDIT
const fs = require('fs');
const path = require('path')
const rules = require('./rules-examples.js');
const modules = [path.resolve('../node_modules/'), path.resolve('../../../node_modules/')];
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

const dir = "${destPath.replace(/\\/g, '/')}";

if (!fs.existsSync(dir)){
    console.log('Creating directory: ' + dir);
    fs.mkdirSync(dir);
}

module.exports = {
  mode: 'development',
  plugins: [
    new ESLintPlugin(),
    ${multiTemplates}
    new webpack.DefinePlugin({
      __BASE_PATH__: "''",
    }),
    new CopyPlugin({
      patterns: [
        { from: '${root.replace(
          /\\/g,
          '/'
        )}/utils/ExampleRunner/serve.json', to: "${destPath.replace(
    /\\/g,
    '/'
  )}" },
      {
        from:
        '../../../node_modules/dicom-microscopy-viewer/dist/dynamic-import/',
        to: '${destPath.replace(/\\/g, '/')}',
        noErrorOnMissing: true,
      },
      ],
    }),
  ],
  entry: {
    ${multiExampleEntryPoints}
  },
  output: {
    path: '${destPath.replace(/\\/g, '/')}',
    filename: '[name].js',
  },
  module: {
    rules,
  },
  experiments: {
    asyncWebAssembly: true
  },
  resolve: {
    alias: {
      '@cornerstonejs/core': '${csRenderBasePath.replace(/\\/g, '/')}',
      '@cornerstonejs/tools': '${csToolsBasePath.replace(/\\/g, '/')}',
      '@cornerstonejs/adapters': '${csAdaptersBasePath.replace(/\\/g, '/')}',
      '@cornerstonejs/dicom-image-loader': '${csDICOMImageLoaderDistPath.replace(
        /\\/g,
        '/'
      )}',
      '@cornerstonejs/nifti-volume-loader': '${csNiftiPath.replace(
        /\\/g,
        '/'
      )}',
    },
    modules,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
      events: false,
    },
  },
  devServer: {
    hot: true,
    open: false,
    port: 3000,
    historyApiFallback: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        commons: {
          test: /[\\/]packages[\\/]/,
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
      },
    }
  },
};
`;
};
