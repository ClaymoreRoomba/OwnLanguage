//token types (TT)
const TT_INT    = "INT";
const TT_FLOAT  = "FLOAT";
const TT_PLUS   = "PLUS";
const TT_MINUS  = "MINUS";
const TT_MUL    = "MUL";
const TT_DIV    = "DIV";
const TT_LPAREN = "LPAREN";
const TT_RPAREN = "RPAREN";

//TOKEN

class Token{
    constructor(type, value){
        this.type = type;
        this.value = value;
        //just a way to neatly print the token
        this.out = this.type + (this.value ? ":" + this.value : "");
    }
    
};

//ERRORS

class Error{

    constructor(error_name, details){

        this.error_name = error_name;
        this.details = details;

    }

    asString(){
        return `${this.error_name}: ${this.details}`;
    }

};

class IllegalCharError extends Error{

    constructor(details){
        super('Illegal Character', details);
    }

};

//LEXERS

class Lexer{

    constructor(text){
        this.text = text;
    }

    makeTokens(){
        const tokens = new Array();

        //used to store strings of numbers
        let numOfPoints = 0;
        let digits = '';

        for(let i = 0; i < this.text.length; i++){

            switch(this.text[i]){

                case '+':
                    tokens.push(new Token(TT_PLUS));
                    break;
                
                case '-':
                    tokens.push(new Token(TT_MINUS));
                    break;
                
                case '*':
                    tokens.push(new Token(TT_MUL));
                    break;
                
                case '/':
                    tokens.push(new Token(TT_DIV));
                    break;

                case '(':
                    tokens.push(new Token(TT_LPAREN));
                    break;
    
                case ')':
                    tokens.push(new Token(TT_RPAREN));
                    break;
                
                case ' ':
                    break;

                default:
                    {
                        const char = this.text[i];

                        //if the char is a digit or a dec point followed by a number
                        if(/\d/.test(char) || (/\./.test(char) && /\d/.test(this.text[i + 1]))){

                            if(char === '.'){

                                if(numOfPoints++ === 0){
                                    digits += char;
                                } else {
                                    tokens.push(new Token(TT_FLOAT, +digits));
                                    digits = '';
                                    numOfPoints = 0;
                                }

                            } else digits += char;

                            //if the next character cannot be added to the number string
                            if(!(/\d/.test(this.text[i + 1]) || (/\./.test(this.text[i + 1]) && /\d/.test(this.text[i + 2])))){
                                
                                //push a token with the correct type
                                tokens.push(new Token(
                                    digits.includes('.') ? 
                                    TT_FLOAT :
                                    TT_INT, 
                                    +digits));
                                
                                //reset the storage
                                digits = '';
                                numOfPoints = 0;
                            }
                        } else {

                            return {
                                tokens: [],
                                error: new IllegalCharError(`Illegal char: '${char}'`)
                            };

                        }

                    }


                    
            }

        }

        return {
            tokens, 
            error: null
        };
    }
};

//RUN

export function run(text){
    const {tokens, error} = new Lexer(text).makeTokens();
    return {tokens, error};
}