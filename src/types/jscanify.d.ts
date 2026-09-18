declare module 'jscanify/client' {
  export default class JScanify {
    highlightPaper(image: HTMLCanvasElement | HTMLImageElement, options?: unknown): HTMLCanvasElement
    extractPaper(
      image: HTMLCanvasElement | HTMLImageElement,
      width: number,
      height: number,
      cornerPoints?: unknown
    ): HTMLCanvasElement
    findPaperContour(img: unknown): unknown
    getCornerPoints(contour: unknown): unknown
  }
}
