namespace InfoConstants {
  export const BRANCH_MAX_LENGTH = 256;
  export const BUILD_NUMBER_MAX_LENGTH = 256;
  export const SHA_MAX_LENGTH = 40; // git sha currently use sha-1, which is exactly 40chars long. If/when this changes to sha-256 this constant will need to be updated to 64chars
  export const MAX_URI_LENGTH = 4096;
}

export default InfoConstants;
