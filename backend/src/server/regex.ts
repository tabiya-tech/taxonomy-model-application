export const RegExp_Str_NotEmptyString: string = "\\S";
export const RegExp_NotEmptyString: RegExp = new RegExp(RegExp_Str_NotEmptyString);

// Hex string of length
export const RegExp_Str_Hex: (length: number) => string = (length: number) => `^[0-9a-f]{${length}}$`;
export const RegExp_Str_Hex_MinLength: (length: number) => string = (length: number) => `^[0-9a-f]{${length},}$`;
export const RegExp_Str_Hex_24: string = RegExp_Str_Hex(24);
export const RegExp_Str_Hex_32: string = RegExp_Str_Hex(32);
export const RegExp_Str_Hex_64: string = RegExp_Str_Hex(64);
export const RegExp_Str_Hex_AnyLength: string = `^[0-9a-f]+$`;

export const RegEx_Skill_Group_Code = new RegExp(/^([a-zA-Z]\d+(\.\d+)*|[a-zA-Z])$/); //TODO move this to the modelSchema
// (^[a-zA-Z]$)|(^([a-zA-Z]\d+)(\.\d+)*$)

export const RegExp_Hex: (length: number) => RegExp = (length: number) => new RegExp(RegExp_Str_Hex(length));
export const RegExp_Hex_MinLength: (length: number) => RegExp = (length: number) =>
  new RegExp(RegExp_Str_Hex_MinLength(length));
export const RegExp_Hex_24: RegExp = new RegExp(RegExp_Str_Hex_24);
export const RegExp_Hex_32: RegExp = new RegExp(RegExp_Str_Hex_32);
export const RegExp_Hex_64: RegExp = new RegExp(RegExp_Str_Hex_64);
export const RegExp_Hex_AnyLength: RegExp = new RegExp(RegExp_Str_Hex_AnyLength);

//MongoDB IDs 12 Bytes long (24 Hex long) see https://www.mongodb.com/docs/manual/reference/method/ObjectId/
export const RegExp_Str_ID: string = RegExp_Str_Hex_24;
export const RegExp_ID: RegExp = RegExp_Hex_24;

// UUID version 4 according to RFC4122 https://www.rfc-editor.org/rfc/rfc4122.txt
/*
UUID = time-low "-" time-mid "-" time-high-and-version "-" clock-seq-and-reserved clock-seq-low "-" node
time-low               = 4hexOctet
time-mid               = 2hexOctet
time-high-and-version  = 2hexOctet
clock-seq-and-reserved = hexOctet
clock-seq-low          = hexOctet
node                   = 6hexOctet
example: f81d4fae-7dec-11d0-a765-00a0c91e6bf6
*/
const hexOctet: (length: number) => string = (length: number) => `[0-9a-f]{${2 * length}}`;
export const RegExp_Str_UUIDv4 = `^${hexOctet(4)}-${hexOctet(2)}-${hexOctet(2)}-${hexOctet(2)}-${hexOctet(6)}$`;
export const RegExp_UUIDv4: RegExp = new RegExp(RegExp_Str_UUIDv4);

export const RegExp_Str_UUIDv4_Or_Empty = `^(${hexOctet(4)}-${hexOctet(2)}-${hexOctet(2)}-${hexOctet(2)}-${hexOctet(
  6
)}|)$`;
export const RegExp_UUIDv4_Or_Empty: RegExp = new RegExp(RegExp_Str_UUIDv4_Or_Empty);
