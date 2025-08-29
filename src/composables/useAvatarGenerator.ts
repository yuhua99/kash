import { computed } from 'vue'

interface AvatarConfig {
  size: number
  seed: string
}

export function useAvatarGenerator(config: AvatarConfig) {
  // Simple hash function to generate deterministic values from string
  const hashCode = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // PRNG class for seeded random generation
  class SeededRandom {
    private seed: number

    constructor(seed: string) {
      this.seed = hashCode(seed)
    }

    next(): number {
      this.seed = (this.seed * 16807) % 2147483647
      return (this.seed - 1) / 2147483646
    }

    integer(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min
    }

    pick<T>(array: T[]): T {
      return array[this.integer(0, array.length - 1)]
    }
  }

  // DiceBear color palette
  const colorPalette = ['0a5b83', '1c799f', '69d2e7', 'f1f4dc', 'f88c49']

  // Shape definitions based on DiceBear shapes
  const shapeDefinitions = [
    // Rectangle
    'M90 10H10v80h80V10ZM0 0v100h100V0H0Z',
    // Rectangle filled
    'M0 0h100v100H0V0Z',
    // Ellipse filled
    'M100 50A50 50 0 1 1 0 50a50 50 0 0 1 100 0Z',
    // Ellipse
    'M50 90a40 40 0 1 0 0-80 40 40 0 0 0 0 80Zm0 10A50 50 0 1 0 50 0a50 50 0 0 0 0 100Z',
    // Polygon filled (triangle)
    'm50 7 50 86.6H0L50 7Z',
    // Polygon (triangle outline)
    'M50 7 0 93.6h100L50 7Zm0 20L17.3 83.6h65.4L50 27Z',
    // Line
    'M45-150h10v400H45z',
  ]

  const generateAvatar = (seed: string) => {
    const rng = new SeededRandom(seed)

    // Select colors
    const backgroundColor = `#${rng.pick(colorPalette)}`
    const shape1Color = `#${rng.pick(colorPalette)}`
    const shape2Color = `#${rng.pick(colorPalette)}`
    const shape3Color = `#${rng.pick(colorPalette)}`

    // Generate shapes with transforms
    const generateLayer = (shapeColor: string, scale: number, offsetRange: number) => {
      if (rng.next() < 0.3) return '' // 30% chance of no shape

      const shape = rng.pick(shapeDefinitions)
      const offsetX = rng.integer(-offsetRange, offsetRange)
      const offsetY = rng.integer(-offsetRange, offsetRange)
      const rotation = rng.integer(-180, 180)

      return `
        <g transform="translate(50 50) scale(${scale}) rotate(${rotation}) translate(${offsetX} ${offsetY}) translate(-50 -50)">
          <path d="${shape}" fill="${shapeColor}" />
        </g>`
    }

    const layer1 = generateLayer(shape1Color, 1.2, 65)
    const layer2 = generateLayer(shape2Color, 0.8, 40)
    const layer3 = generateLayer(shape3Color, 0.4, 25)

    return `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${backgroundColor}" />
        ${layer1}
        ${layer2}
        ${layer3}
      </svg>
    `.trim()
  }

  const avatarSvg = computed(() => {
    return generateAvatar(config.seed)
  })

  const avatarDataUrl = computed(() => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg.value)}`
  })

  return {
    avatarSvg,
    avatarDataUrl,
  }
}

