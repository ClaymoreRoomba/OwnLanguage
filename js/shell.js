const prompt = require("prompt-sync")();

while(true){

    const input = prompt("basic > ");
    if(input === null) break;
    console.log(input);

}