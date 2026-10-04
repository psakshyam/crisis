import { onBeforeUnmount, ref } from "vue";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Reveals `length` characters over time. `shown` is the number of visible
// characters; `done` flips when the full text is visible.
export function useTypewriter(speedMs = 18) {
  const shown = ref(0);
  const done = ref(true);
  let timer = null;
  let total = 0;
  let onDone = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function finish() {
    stop();
    shown.value = total;
    if (!done.value) {
      done.value = true;
      onDone?.();
    }
  }

  // `from` keeps already-visible characters (e.g. a line that continues).
  function start(length, callback = null, from = 0) {
    stop();
    total = length;
    onDone = callback;
    shown.value = Math.min(from, length);
    done.value = false;
    if (!length || shown.value >= length || prefersReducedMotion()) {
      finish();
      return;
    }
    timer = setInterval(() => {
      shown.value += 1;
      if (shown.value >= total) finish();
    }, speedMs);
  }

  onBeforeUnmount(stop);

  return { shown, done, start, finish };
}

export { prefersReducedMotion };
