export default {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      // 根元素字体大小。对于 1920px 宽度的设计稿，1rem = 100px
      rootValue: 100,
      // 允许转换的属性，* 代表全部
      propList: ['*'],
      // 排除 node_modules 目录，防止 Element Plus 等第三方库样式被转换
      exclude: /node_modules/i,
      // 过滤掉不需要转换的选择器
      selectorBlackList: [],
      // 最小的转换数值，小于 2px 的不转换
      minPixelValue: 2
    }
  }
}
