const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    plugins: [
      // Define global feature flags for Vue
      new webpack.DefinePlugin({
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_OPTIONS_API__: 'true'
      })
    ]
  },
  // Dev server configuration
  devServer: {
    proxy: {
      '/api': {
        target: 'https://planthomieapi20250519212023-g3dxbqerfvhhf0a6.northeurope-01.azurewebsites.net',
        changeOrigin: true,
        secure: true
      }
    }
}
})
