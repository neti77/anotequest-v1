export default ({ config }) => ({
  ...config,
  name: 'AnoteQuest Mobile',
  slug: 'anotequest-mobile',
  version: '0.0.1',
  extra: {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || ''
  }
});
