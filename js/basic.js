//token types (TT)
const TT_INT        = "INT";
const TT_FLOAT      = "FLOAT";
const TT_IDENTIFIER = "IDENTIFIER";
const TT_KEYWORD    = "KEYWORD";
const TT_PLUS       = "PLUS";
const TT_MINUS      = "MINUS";
const TT_MUL        = "MUL";
const TT_DIV        = "DIV";
const TT_POW        = "POW";
const TT_EQ         = "EQUALS";
const TT_LPAREN     = "LPAREN";
const TT_RPAREN     = "RPAREN";
const TT_EOF        = "EOF";

//TOKEN ####################################################

class Token{
    constructor(type, value, pos){
        this.type = type;
        this.value = value || null;
        //just a way to neatly print the token
        this.out = this.type + (this.value ? ":" + this.value : "");

        if(pos){
            this.pos = pos.copy();
        }
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

class InvalidSyntaxError extends Error{

    constructor(pos, details){
        super(pos, 'Invalid Syntax', details);
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

    advance(curr_char = null){

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
                    tokens.push(new Token(TT_PLUS, null, pos));
                    break;
                
                case '-':
                    tokens.push(new Token(TT_MINUS, null, pos));
                    break;
                
                case '*':
                    tokens.push(new Token(TT_MUL, null, pos));
                    break;
                
                case '/':
                    tokens.push(new Token(TT_DIV, null, pos));
                    break;

                case '^':
                    tokens.push(new Token(TT_POW, null, pos));
                    break;

                case '=':
                    tokens.push(new Token(TT_EQ, null, pos));
                    break;

                case '(':
                    tokens.push(new Token(TT_LPAREN, null, pos));
                    break;
    
                case ')':
                    tokens.push(new Token(TT_RPAREN, null, pos));
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
                                    tokens.push(new Token(TT_FLOAT, +digits, pos));
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
                                    +digits, pos));
                                
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

        tokens.push(new Token(TT_EOF, null, pos));
        return {
            tokens, 
            error: null
        };

    }
};

//NODES ####################################################
//make an operations tree to organize the order of operations

class NumNode{

    constructor(token){
        this.token = token;
    }

};

//Binary operator
class BinOpNode{

    constructor(leftNode, opToken, rightNode){

        this.leftNode = leftNode;
        this.opToken = opToken;
        this.rightNode = rightNode;

    }

};

class UnOpNode{

    constructor(opToken, node){

        this.opToken = opToken;
        this.node = node;

    }

};

//PARSE RESULT ##############################################

class ParseResult{

    constructor(){
        this.error = null;
        this.node = null;
    }

    register(result){

        if(result instanceof ParseResult){

            if(result.error) this.error = result.error;
            return result.node;

        }

        return result;
    }
    success(node){

        this.node = node;
        return this;

    }
    failure(err){

        this.error = err;
        return this;

    }

};

//PARSER ####################################################

class Parser{

    constructor(tokens){
        
        this.tokens = tokens;
        this.tok_idx = -1;
        this.advance();

    }

    //making a for loop that can advance anywhere in the code
    advance(){

        this.tok_idx++;

        if(this.tok_idx < this.tokens.length){

            this.current_token = this.tokens[this.tok_idx];

        }
        return this.current_token;

    }

    parse(){
        const res = this.expr();
        
        if(!res.error && this.current_token.type !== TT_EOF){
            
            return res.failure( new InvalidSyntaxError(
                this.current_token.pos,
                "Expected +, -, *, or /"
            ) );

        }

        return res;
    }

    binaryOperation(rule, opTTs){

        let left = rule()

        while(opTTs.includes(this.current_token.type)){

            let opToken = this.current_token;
            
            this.advance();
            
            let right = rule();

            left = BinOpNode(left, opToken, right);

        }

        return left;

    }

    unit(){

        const res = new ParseResult();
        const token = this.current_token;

        if([TT_INT, TT_FLOAT].includes(token.type)){
            
            res.register( this.advance() );
            
            return res.success(new NumNode(token));
        }

        else if(token.type === TT_LPAREN){

            res.register(this.advance());

            const expr = res.register(this.expr());

            if(res.error) return res;

            if(this.current_token.type === TT_RPAREN){

                res.register(this.advance());
                return res.success(expr)

            } else return res.failure(new InvalidSyntaxError(this.current_token.pos, "Expected ')'"));

        }

        return res.failure(new InvalidSyntaxError(
            this.current_token.pos,
            "Expected a Number, '+', '-', or '('"
            ));

    }

    power(){

        const res = new ParseResult();
        let left = res.register(this.unit());

        if(res.error) return res;

        while([TT_POW].includes(this.current_token.type)){

            let opToken = this.current_token;
            
            res.register(this.advance());
            
            let right = res.register(this.factor());

            if(res.error) return res;

            left = new BinOpNode(left, opToken, right);

        }

        return res.success(left);

    }

    factor(){

        const res = new ParseResult();
        const token = this.current_token;

        //checking if there is a plus or minus infront of a number
        if([TT_PLUS, TT_MINUS].includes(token.type)){

            res.register( this.advance() );

            const factor = res.register(this.factor());

            if(res.error) return res;
            return res.success(new UnOpNode(token, factor));

        }

        return this.power();

    }
    term(){

        const res = new ParseResult();
        let left = res.register(this.factor());

        if(res.error) return res;

        while([TT_MUL, TT_DIV].includes(this.current_token.type)){

            let opToken = this.current_token;
            
            res.register(this.advance());
            
            let right = res.register(this.factor());

            if(res.error) return res;

            left = new BinOpNode(left, opToken, right);

        }

        return res.success(left);

    }
    expr(){

        const res = new ParseResult();
        let left = res.register(this.term());

        if(res.error) return res;

        while([TT_PLUS, TT_MINUS].includes(this.current_token.type)){

            let opToken = this.current_token;
            
            res.register(this.advance());
            
            let right = res.register(this.term());

            if(res.error) return res;

            left = new BinOpNode(left, opToken, right);

        }

        return res.success(left);

    }

};
//VALUES ############################################

class Number{

    constructor(value){
        this.value = value;
        this.setPos();
    }

    setPos(pos = null){

        this.pos = pos;
        return this;

    }

    addedTo(other){
        if(other instanceof Number){
            return new Number(this.value + other.value);
        }
    }
    subbedBy(other){
        if(other instanceof Number){
            return new Number(this.value - other.value);
        }
    }
    multedBy(other){
        if(other instanceof Number){
            return new Number(this.value * other.value);
        }
    }
    divedBy(other){
        if(other instanceof Number){
            if(other.value === 0){
                return new Error(other.pos, "DIV BY 0", "attempted divide by 0");
            }
            return new Number(this.value / other.value);
        }
    }
    powedBy(other){
        if(other instanceof Number){
            return new Number(this.value ** other.value);
        }
    }

};

//INTERPRETER ############################################

class Interpreter{

    //looking through the operation tree to get the order of operations
    visit(node){
        const methodName = `visit_${node?.constructor.name}`;
        const fn = this[methodName];
        return fn(node);
    }

    visit_undefined(node){
        console.log("Found undefined node");
    }
    visit_NumNode(node){
        return new Number(node.token.value).setPos(node.token.pos);
    }
    visit_BinOpNode(node){
        const left = new Interpreter().visit(node.leftNode);
        const right = new Interpreter().visit(node.rightNode);

        let result;
        switch(node.opToken.type){
            case TT_PLUS:
                result = left.addedTo(right);
                break;
            case TT_MINUS:
                result = left.subbedBy(right);
                break;
            case TT_MUL:
                result = left.multedBy(right);
                break;
            case TT_DIV:
                result = left.divedBy(right);
                break;
            case TT_POW:
                result = left.powedBy(right);
                break;
        }

        return result.setPos(node.opToken.pos);
    }
    visit_UnOpNode(node){
        let num = new Interpreter().visit(node.node);

        if(node.opToken.type === TT_MINUS){
            num = num.multedBy(new Number(-1));
        }

        return num.setPos(node.node.token.pos);
    }

};

debugger;

//RUN ####################################################

export function run(fileName, text){

    //Fixing using brackets to multiply
    text = text.replace(/(\d)\(/, '$1' + ' * (');
    
    //Generate tokens
    const {tokens, error} = new Lexer(fileName, text).makeTokens();
    if(error) return {tokens: null, error};

    //Generate Abstract Syntax Tree
    const parser = new Parser(tokens);
    const ast = parser.parse();
    if(ast.error) return {ast: null, error: ast.error}

    //run program
    const interpreter = new Interpreter();
    const result = interpreter.visit(ast.node);

    return {result, error: null};
    // return {ast: ast.node, error: ast.error};
    
}