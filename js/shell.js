import PromptSync from "prompt-sync";
import { run } from "./basic.js"
const prompt = PromptSync();


while(true){

    const input = prompt("basic > ");
    if(input === null) break;

    const result = run(input);

    if(result.error){
        console.error(result.error.asString());
    } else {
        console.log(result.tokens.map(token => token.out));
    }
    
}