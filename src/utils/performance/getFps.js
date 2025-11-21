/**
 * Gets the current frames per second (FPS).
 * @returns {Promise<number>} FPS value.
 * @example
 * getFps().then(fps => console.log(fps));
 */
export function getFps() {
  return new Promise(resolve => {
    let frames = 0;
    const start = performance.now();
    function frame() {
      frames++;
      if (performance.now() - start < 1000) {
        requestAnimationFrame(frame);
      } else {
        resolve(frames);
      }
    }
    frame();
  });
}
