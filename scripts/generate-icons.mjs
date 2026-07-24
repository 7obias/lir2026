import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const pathFromScript = (path) => fileURLToPath(new URL(path, import.meta.url))
const source = pathFromScript('../public/logo.png')
const publicDirectory = pathFromScript('../public/')
const iconsDirectory = pathFromScript('../public/icons/')

await mkdir(iconsDirectory, { recursive: true })

const renderIcon = (size, destination, inset = 0) => {
  const contentSize = Math.round(size * (1 - inset * 2))

  return sharp(source)
    .resize(contentSize, contentSize, {
      fit: 'contain',
      background: '#000000',
    })
    .extend({
      top: Math.floor((size - contentSize) / 2),
      bottom: Math.ceil((size - contentSize) / 2),
      left: Math.floor((size - contentSize) / 2),
      right: Math.ceil((size - contentSize) / 2),
      background: '#000000',
    })
    .png()
    .toFile(destination)
}

await Promise.all([
  renderIcon(16, `${publicDirectory}/favicon-16.png`),
  renderIcon(32, `${publicDirectory}/favicon-32.png`),
  renderIcon(180, `${publicDirectory}/apple-touch-icon.png`),
  renderIcon(192, `${iconsDirectory}/icon-192.png`),
  renderIcon(512, `${iconsDirectory}/icon-512.png`),
  renderIcon(512, `${iconsDirectory}/icon-maskable-512.png`, 0.1),
])

console.log('Generated favicon and PWA icons from public/logo.png')
