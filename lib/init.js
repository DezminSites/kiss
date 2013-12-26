var glob = require("glob")  
var fs = require('fs')
var exec = require('child_process').exec
var child, username, usermail, files

//Fill vars with async functions (Very ugly!!!)
(function(){
                    
    child = exec('git config --get user.name',
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                username = stdout
            }
        })
        
    child = exec('git config --get user.email',
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                usermail = stdout
            }
        })
        
    child = exec('ls',
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                files = stdout
                files = files.split('\n')
            }
        })
        
                
})()
    
glob(process.cwd() + '/*', function (er, files) {
    if (files.length > 0 )
        console.log('Ops... Directory project must be empty!')
    else {
        var ncp = require('ncp').ncp

        ncp.limit = 16;

        ncp(__dirname+'/../skeleton', '.', function (err) {
            if (err) {
                return console.error(err)
            }
            makeJson()
        })
            
    }
})

function makeJson(){
    var inquirer = require("inquirer")
    var path = require("path")

    var questions = [
    {
        type: "input",
        name: "name",
        message: "Name",
        'default': function(){
            return path.basename(process.cwd())
        }
    },
    {
        type: "input",
        name: "version",
        message: "Version",
        'default': function(){
            return '0.0.0'
        }
    },
    {
        'name': 'description',
        'message': 'description',
        'default': 'A wonderful app created with kiss!',
        'type': 'input'
    },
    {
        'name': 'keywords',
        'message': 'keywords',
        'default': '',
        'type': 'input'
    },
    {
        'name': 'authors',
        'message': 'authors',
        'default': function(){
            return username.replace('\n','') + ' <' + usermail.replace('\n','') + '>'
        },
        'type': 'input'
    },
    {
        'name': 'license',
        'message': 'license',
        'default': 'MIT',
        'type': 'input'
    },
    {
        'name': 'homepage',
        'message': 'homepage',
        'default': '',
        'type': 'input'
    }
    ]

    inquirer.prompt( questions, function( answers ) {
        fs.writeFileSync(process.cwd() + '/package.json', JSON.stringify(answers, null, "  "))
        console.log('Your app is ready to Rock!')
    })
}