var subdomainer = require('./subdomainer.js');

var sub = new subdomainer('settings.json');

var rl = require('readline');

var i = rl.createInterface({
    input: process.stdin,
    output: process.stdout
});

var ask = function(){
    i.question("What is the name of subdomain you would like to create? \nName:", function(subdomain) {

        if( sub.addSubdomain(subdomain) )
            console.log("\n" + subdomain + " added");
        i.question("\n Add another? [N/y] :", function(yesNo){
            if(yesNo.toLowerCase() == "y"){
                ask();
            }else{
                i.close();
                process.stdin.destroy();
            }
        });
    });
};


ask();