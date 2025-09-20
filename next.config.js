/** @type {import('next').NextConfig} */
const dotenv = require('dotenv');

dotenv.config();

const nextConfig = {
  // Pages Router 不需要 next-intl 插件
  // 国际化通过 NextIntlClientProvider 在组件中处理
}

module.exports = nextConfig
