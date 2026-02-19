const listeners = [];

const NetInfo = {
  addEventListener: jest.fn((callback) => {
    listeners.push(callback);
    return jest.fn(() => {
      const idx = listeners.indexOf(callback);
      if (idx > -1) listeners.splice(idx, 1);
    });
  }),

  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    })
  ),
};

module.exports = NetInfo;
module.exports.default = NetInfo;
