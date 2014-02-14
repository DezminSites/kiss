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
        var that = this
        var url = "https://github.com/DezminSites/kiss-skeleton"
        console.log('Downloading full repo ' + url + '...')
        var request = require('request')
        var req = request(url+'/archive/master.zip')
        req.on('response', function (resp) {
            if (resp.statusCode == 200){
                var writable = fs.createWriteStream(process.cwd() + "/master.zip")
                req.pipe(writable)
                writable.on('finish',function(){
                    unpackSkeleton()
                })
            }
            else
                that.throwError()
        })
    }
})

unpackSkeleton = function(){//Unpack repo zip
    var that = this
    console.log('Unpacking skeleton...')
    var AdmZip = require('adm-zip')
    var zip = new AdmZip(process.cwd() + "/master.zip")
    var zipEntries = zip.getEntries()

    zipEntries.forEach(function(zipEntry) {
        var entryNameArr = zipEntry.entryName.split('/')
        var entryName = entryNameArr.slice(1).join('/')
        try{
            zip.extractEntryTo(zipEntry.entryName, process.cwd() + "/"+entryName, /*maintainEntryPath*/false, /*overwrite*/true)
        } catch(e){}
    })
    fs.unlinkSync(process.cwd() + "/master.zip")
    console.log('Skeleton successfully installed!')
    makeJson()
}

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