type Scheduler =
  typeof requestAnimationFrame
  | typeof onTickEnd;

export function throttleWithRaf<F extends AnyToVoidFunction>(fn: F) {
  return throttleWith(fastRaf, fn);
}

export function throttleWithPrimaryRaf<F extends AnyToVoidFunction>(fn: F) {
  return throttleWith(fastRafPrimary, fn);
}

export function throttleWithTickEnd<F extends AnyToVoidFunction>(fn: F) {
  return throttleWith(onTickEnd, fn);
}

export function throttleWith<F extends AnyToVoidFunction>(schedulerFn: Scheduler, fn: F) {
  let waiting = false;
  let args: Parameters<F>;

  return (..._args: Parameters<F>) => {
    args = _args;

    if (!waiting) {
      waiting = true;

      schedulerFn(() => {
        waiting = false;
        fn(...args);
      });
    }
  };
}

let fastRafCallbacks: NoneToVoidFunction[] | undefined;
let fastRafPrimaryCallbacks: NoneToVoidFunction[] | undefined;

// May result in an immediate execution if called from another `requestAnimationFrame` callback
export function fastRaf(callback: NoneToVoidFunction, isPrimary = false) {
  if (!fastRafCallbacks) {
    fastRafCallbacks = isPrimary ? [] : [callback];
    fastRafPrimaryCallbacks = isPrimary ? [callback] : [];

    requestAnimationFrame(() => {
      const currentCallbacks = fastRafCallbacks!;
      const currentPrimaryCallbacks = fastRafPrimaryCallbacks!;
      fastRafCallbacks = undefined;
      fastRafPrimaryCallbacks = undefined;
      currentPrimaryCallbacks.forEach((cb) => cb());
      currentCallbacks.forEach((cb) => cb());
    });
  } else if (isPrimary) {
    fastRafPrimaryCallbacks!.push(callback);
  } else {
    fastRafCallbacks.push(callback);
  }
}

export function fastRafPrimary(callback: NoneToVoidFunction) {
  fastRaf(callback, true);
}

let onTickEndCallbacks: NoneToVoidFunction[] | undefined;
let onTickEndPrimaryCallbacks: NoneToVoidFunction[] | undefined;

export function onTickEnd(callback: NoneToVoidFunction, isPrimary = false) {
  if (!onTickEndCallbacks) {
    onTickEndCallbacks = isPrimary ? [] : [callback];
    onTickEndPrimaryCallbacks = isPrimary ? [callback] : [];

    Promise.resolve().then(() => {
      const currentCallbacks = onTickEndCallbacks!;
      const currentPrimaryCallbacks = onTickEndPrimaryCallbacks!;
      onTickEndCallbacks = undefined;
      onTickEndPrimaryCallbacks = undefined;
      currentPrimaryCallbacks.forEach((cb) => cb());
      currentCallbacks.forEach((cb) => cb());
    });
  } else if (isPrimary) {
    onTickEndPrimaryCallbacks!.push(callback);
  } else {
    onTickEndCallbacks.push(callback);
  }
}

export function onTickEndPrimary(callback: NoneToVoidFunction) {
  onTickEnd(callback, true);
}

let beforeUnloadCallbacks: NoneToVoidFunction[] | undefined;

export function onBeforeUnload(callback: NoneToVoidFunction, isLast = false) {
  if (!beforeUnloadCallbacks) {
    beforeUnloadCallbacks = [];
    // eslint-disable-next-line no-restricted-globals
    self.addEventListener('beforeunload', () => {
      beforeUnloadCallbacks!.forEach((cb) => cb());
    });
  }

  if (isLast) {
    beforeUnloadCallbacks.push(callback);
  } else {
    beforeUnloadCallbacks.unshift(callback);
  }

  return () => {
    beforeUnloadCallbacks = beforeUnloadCallbacks!.filter((cb) => cb !== callback);
  };
}
