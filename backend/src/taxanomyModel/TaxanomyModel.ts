export default class TaxanomyModel { 

    constructor(public name: string, 
        public locale:string,  
        public csvFiles :string[],
        public descriptin?: string,
        ) {}
}