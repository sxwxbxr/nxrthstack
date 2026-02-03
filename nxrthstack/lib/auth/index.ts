// Re-export server utilities
export {
  authServer,
  getExtendedUser,
  getExtendedUserByEmail,
  verifyLegacyPassword,
  linkNeonAuthUser,
  createLocalUser,
  getSessionWithUser,
  type ExtendedUser,
} from "./server";
