const path = require('path')
process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  chainWebpack: config => {
    config.optimization.delete('splitChunks')
    /*config.plugin('define').tap((definitions) => {
      definitions[0]['process.env']['NODE_ENV'] = JSON.stringify('production')
      return definitions
    })*/
  },
  /*configureWebpack: {
    optimization: {
      splitChunks: {
        minSize: 10000,
        maxSize: 250000,
      }
    }
  },*/
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000'
      }
    }
  },
  outputDir: path.resolve(__dirname, '../server/public'),
}
