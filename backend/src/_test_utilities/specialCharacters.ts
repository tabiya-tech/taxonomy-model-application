const sampleValidSpecialCharacters = "^°!\"§$%&/()=?`´*+#'-_.,;<>öäü@[]{}|¡“¶¢[]≠¿'„…∞~<•±æœ";
const sampleInternationCharacters = "αβγδεζηθικλμνξοπρστυφχψω";
const THREE_BYTE_UTF8_CHAR = "€";
export const WHITESPACE = " \n\r\t";

export function getTestString(length: number, prefix: string = ""): string {
    return (prefix + sampleValidSpecialCharacters + sampleInternationCharacters).slice(0, length).padEnd(length, THREE_BYTE_UTF8_CHAR);
}

export function get3ByteTestString(length: number, prefix: string = ""): string {
    return prefix + THREE_BYTE_UTF8_CHAR.repeat(length - prefix.length);
}

export function getRandomString(length: number) {
    let result = '';
    const characters = sampleValidSpecialCharacters + sampleInternationCharacters + WHITESPACE;
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}