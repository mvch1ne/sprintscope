// Shared helpers for requestVideoFrameCallback (not yet in lib.dom)

export interface VideoElementWithRVFC extends HTMLVideoElement {
  requestVideoFrameCallback(
    cb: (now: number, metadata: { mediaTime: number }) => void,
  ): number;
}

export function hasRVFC(el: HTMLVideoElement): el is VideoElementWithRVFC {
  return 'requestVideoFrameCallback' in el;
}
