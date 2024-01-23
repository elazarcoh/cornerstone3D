import { getWebWorkerManager } from '@cornerstonejs/core';

let registered = false;

export function registerPolySegWorker() {
  if (registered) {
    return;
  }

  registered = true;

  const workerFn = () => {
    return new Worker(new URL('./polySegConverters.js', import.meta.url), {
      name: 'polySeg',
    });
  };

  const workerManager = getWebWorkerManager();

  const options = {
    maxWorkerInstances: 1, // Todo, make this configurable
    autoTerminateOnIdle: {
      enabled: true,
      idleTimeThreshold: 2000,
    },
  };

  workerManager.registerWorker('polySeg', workerFn, options);
}
