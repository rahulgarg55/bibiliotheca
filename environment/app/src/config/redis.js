// Mock redis client for edition_2
const redisClient = {
  get: async (key) => null,
  setEx: async (key, time, value) => {},
  del: async (key) => {},
  connect: async () => console.log('Mock Redis connected'),
  on: (event, cb) => {}
};
export default redisClient;
