const fs = require('fs')
const path = require('path')
const { paths } = require('react-app-rewired')
const { ESBuildMinifyPlugin } = require('esbuild-loader')

const {
  override,
  addDecoratorsLegacy,
  fixBabelImports,
  addLessLoader,
} = require('customize-cra')

// fixBabelImports is for antd:
// https://ant.design/docs/react/use-with-create-react-app

// addLessLoader is to change to LESS (with CSS modules):
// https://github.com/arackaf/customize-cra/blob/c0aef393bf41621e48aefc9e4fcc171e90dc3712/api.md#addlessloaderloaderoptions
// ...and also to integrate with antd:
// https://ant.design/docs/react/use-with-create-react-app

// I forgot what addDecoratorsLegacy and enableRequireEnsure are for :(

const enableRequireEnsure = () => config => {
  config.output.globalObject = 'this'
  config.module.rules[0].parser.requireEnsure = true

  const webpackOverrideSvgFiles = {
    test: /\.svg$/i,
    use: ['@svgr/webpack', 'url-loader'],
  }
  config.module.rules[2].oneOf.splice(3, 0, webpackOverrideSvgFiles)

  return config
}

module.exports = override(
  addDecoratorsLegacy(),
  // enableRequireEnsure(),
  fixBabelImports('import', {
    libraryName: 'antd',
    libraryDirectory: 'es',
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: {
      '@primary-color': '#ff5d64',
      '@font-size-base': '15px',
      '@font-family':
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    paths: [path.resolve(__dirname), path.resolve(__dirname, 'src')],
  }),
  rewiredEsbuild()
)

function rewiredEsbuild({ ESBuildMinifyOptions, ESBuildLoaderOptions } = {}) {
  return function(config, _webpackEnv) {
    const useTypeScript = fs.existsSync(paths.appTsConfig)

    // replace babel-loader to esbuild-loader
    for (const { oneOf } of config.module.rules) {
      if (oneOf) {
        let babelLoaderIndex = -1
        const rules = Object.entries(oneOf)
        for (const [index, rule] of rules.slice().reverse()) {
          if (
            rule.loader &&
            rule.loader.includes(path.sep + 'babel-loader' + path.sep)
          ) {
            oneOf.splice(index, 1)
            babelLoaderIndex = index
          }
        }
        if (~babelLoaderIndex) {
          oneOf.splice(babelLoaderIndex, 0, {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: [
              paths.appSrc,
              path.resolve('node_modules/@anycable'), // @anycable/* libs are too modern for us :)
            ],
            loader: require.resolve('esbuild-loader'),
            options: ESBuildLoaderOptions || {
              loader: useTypeScript ? 'tsx' : 'jsx',
              target: 'es2015',
            },
          })
        }
      }
    }

    // replace minimizer
    for (const [index, minimizer] of Object.entries(
      config.optimization.minimizer
    )
      .slice()
      .reverse()) {
      const options = ESBuildMinifyOptions || {
        target: 'es2015',
        css: true,
      }
      // replace TerserPlugin to ESBuildMinifyPlugin
      if (minimizer.constructor.name === 'TerserPlugin') {
        config.optimization.minimizer.splice(
          index,
          1,
          new ESBuildMinifyPlugin(options)
        )
      }
      // remove OptimizeCssAssetsWebpackPlugin
      if (
        options.css &&
        minimizer.constructor.name === 'OptimizeCssAssetsWebpackPlugin'
      ) {
        config.optimization.minimizer.splice(index, 1)
      }
    }

    return config
  }
}
