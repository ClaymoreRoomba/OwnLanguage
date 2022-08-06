//token types (TT)
const TT_INT    = "INT";
const TT_FLOAT  = "FLOAT";
const TT_PLUS   = "PLUS";
const TT_MINUS  = "MINUS";
const TT_MUL    = "MUL";
const TT_DIV    = "DIV";
const TT_LPAREN = "LPAREN";
const TT_RPAREN = "RPAREN";

//TOKEN ####################################################

class Token{
    constructor(type, value){
        this.type = type;
        this.value = value;
        //just a way to neatly print the token
        this.out = this.type + (this.value ? ":" + this.value : "");
    }
    
};

//ERRORS ####################################################

class Error{

    constructor(pos, error_name, details){

        this.pos = pos;
        this.error_name = error_name;
        this.details = details;

    }

    asString(){
        return `${this.error_name}: ${this.details}
        File: ${this.pos.fileName} at line: ${this.pos.line + 1}`;
    }

};

class IllegalCharError extends Error{

    constructor(pos, details){
        super(pos, 'Illegal Character', details);
    }

};

//POSITION ####################################################

class Position{

    constructor(idx, line, col, fileName, fileTxt){
        this.idx = idx;
        this.line = line;
        this.col = col;
        this.fileName = fileName;
        this.fileTxt = fileTxt;
    }

    advance(curr_char){

        this.col++;
        this.idx++;

        if(curr_char == '\n'){

            this.line++;
            this.col = 0;

        }

        return this;
    }

    copy(){
        return new Position(this.idx, this.line, this.col, this.fileName, this.fileTxt);
    }

};

//LEXERS ####################################################

class Lexer{

    constructor(fileName, text){
        this.fileName = fileName;
        this.text = text;
    }

    makeTokens(){
        const tokens = new Array();

        let pos = new Position(0, 0, 0, this.fileName, this.text);

        //used to store strings of numbers
        let numOfPoints = 0;
        let digits = '';

        for(let i = 0; i < this.text.length; i++){

            pos.advance(this.text[i]);

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
                                error: new IllegalCharError(pos, `Illegal char: '${char}'`)
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

//RUN ####################################################

export function run(fileName, text){
    const {tokens, error} = new Lexer(fileName, text).makeTokens();
    return {tokens, error};
}