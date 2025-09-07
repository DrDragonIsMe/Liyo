// 404 错误处理中间件
export const notFound = (req, res, next) => {
  const error = new Error(`未找到路由 - ${req.originalUrl}`)
  res.status(404)
  next(error)
}