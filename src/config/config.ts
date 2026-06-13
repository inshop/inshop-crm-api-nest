export default () => ({
  port: parseInt(process.env.PORT as string, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION',
});
