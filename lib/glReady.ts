/** External store: true once the page is idle and the shared WebGL canvas may load. */
let ready = false;
const listeners = new Set<() => void>();

export const glReady = {
  get: () => ready,
  set: (v: boolean) => {
    if (ready === v) return;
    ready = v;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
