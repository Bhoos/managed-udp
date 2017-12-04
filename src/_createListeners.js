export default function createListeners(types) {
  const obj = {
    add(type, listener) {
      if (this[type] !== null) {
        if (this[type]) {
          throw new Error(`Listener already defined for ${type} event`);
        } else {
          throw new Error(`Unsupported event ${type}`);
        }
      }

      this[type] = listener;
    },

    fire(type, args) {
      const listener = this[type];
      if (listener) {
        listener.apply(listener, args);
        return;
      }

      if (listener !== null) {
        throw new Error(`Unsupported event ${type} should not be fired`);
      }
    },
  };

  types.forEach((type) => {
    // Right now I do not think we need multiple listeners for the same event
    // If needed change this entire object to support array
    obj[type] = null;
  });

  return obj;
}
