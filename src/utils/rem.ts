// 默认设计稿宽度（PC端通常为 1920px）
const DESIGN_WIDTH = 1920
// 基准字体大小（1rem = 100px）
const BASE_SIZE = 100
// 适配的最小宽度限制，低于此宽度不再缩小以防文字太小
const MIN_WIDTH = 1200
// 适配的最大宽度限制，高于此宽度不再变大
const MAX_WIDTH = 2560

function setRem() {
  const clientWidth = document.documentElement.clientWidth || document.body.clientWidth
  let targetWidth = clientWidth

  if (clientWidth < MIN_WIDTH) {
    targetWidth = MIN_WIDTH
  } else if (clientWidth > MAX_WIDTH) {
    targetWidth = MAX_WIDTH
  }

  // 动态计算并设置 html font-size
  const fontSize = (targetWidth / DESIGN_WIDTH) * BASE_SIZE
  document.documentElement.style.fontSize = `${fontSize}px`
}

// 初始化
setRem()

// 监听窗口大小变化以重新计算
window.addEventListener('resize', setRem)
