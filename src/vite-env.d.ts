/// <reference types="vite/client" />

interface AstroImageMetadata {
  src: string
  width: number
  height: number
  format: string
}

declare module '*.jpg' {
  const image: AstroImageMetadata
  export default image
}

declare module '*.jpeg' {
  const image: AstroImageMetadata
  export default image
}

declare module '*.png' {
  const image: AstroImageMetadata
  export default image
}

declare module '*.webp' {
  const image: AstroImageMetadata
  export default image
}

declare module '*.svg' {
  const src: string
  export default src
}
