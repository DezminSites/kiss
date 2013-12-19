#!/usr/bin/env node

//var argv = require('optimist').argv
var argv = require('commander')
var fs = require('fs')
var bower = require('bower')
var util = require('util')
var glob = require("glob")
var path = require('path')

//console.log(__dirname)

var pkg = require('./package.json')

argv
  .version(pkg.version)
  .option('-I, --init', 'Create a new project')
  .option('-i, --install [module]', 'Install modules')
  .option('-s, --save', 'Save module as a dependency')
  .option('-d, --dirty', 'Keep the modules folder dirty')
  .parse(process.argv)


if (argv.init) {
    var ncp = require('ncp').ncp

    ncp.limit = 16;

    ncp(__dirname+'/skeleton', '.', function (err) {
        if (err) {
            return console.error(err)
        }
        console.log('Your app is ready to Rock!')
    })
}
else if(argv.install) {
    fs.readdir(process.cwd() + '/modules/'+ argv.install, function(err,files){
        if (typeof files === 'object')
            console.log('Module already installed. Nothing to do!')
        else {
            if (typeof argv.install === 'boolean')
                console.log("Let's install a bunch of modules!")
            else
                installModule(argv.install,argv.save,argv.dirty)
        }
    })   
}
else {
    console.log('Nothing to do! Need help??')
}

function installModule(name,save,dirty){
    //Try to install package
    if (save)
        save = true
    else 
        save = false
    try{
        bower.commands
        .install([name], { save: save }, { /* custom config */ })
        .on('end', function (installed) {
            for (i in installed){
                if (!dirty)
                    clearModule(i)
                console.log(i + ' successfully installed!')
            }
        })
        .on('error', function (error) {
            throwError()
        });                
    } catch(e){
        throwError()
    }
    
    process.on('uncaughtException', function (exception) {
        // handle or ignore error
    });            
}

function throwError(){
    var msg = 'Ops... Something went wrong... Are you sure this package is available?'
    console.log(msg)
}

function clearModule(name){
    try {
        var file = require(process.cwd() + '/modules/'+name+'/package.json')
    } catch(e){}
    if (typeof file == 'undefined'){
        try {
            var file = require(process.cwd() + '/modules/'+name+'/bower.json')
        } catch(e){}
    }
    if (typeof file != 'undefined'){
        var main = file.main
    }
    if (typeof main == 'undefined'){
        console.log('No main attr. Module will stay dirty! =(')
    }else {
        //Delete undesired
        var arr = []
        if(typeof main == 'string')
            arr.push(path.normalize(process.cwd() + '/modules/'+name+'/'+main))
        else if (typeof main == 'object'){
            for (o in main){
                arr.push(path.normalize(process.cwd() + '/modules/'+name+'/'+main[o]))
            }
        }
        makeGlob(name,arr)
    }
}

function makeGlob(name,arr){
    // options is optional
    glob(process.cwd() + '/modules/'+name+'/*',{mark: true}, function (er, files) {
        for(f in files){
            //console.log(files[f])
            if(files[f].charAt(files[f].length - 1) == '/'){
                dir = files[f].split('/').slice(-2,-1)
                makeGlob(name+'/'+dir[0],arr)
            }
            else{
                files[f] = path.normalize(files[f])
                if (arr.indexOf(files[f]) > -1 || arr.indexOf(files[f].substr(1)) > -1)
                    true
                else{
                    if (files[f].slice(-5) != '.json')
                        fs.unlinkSync(files[f])
                    try{
                        //Removes only empty dirs
                        console.log(path.dirname(files[f]))
                          fs.rmdirSync(path.dirname(files[f]))
                    }catch(e){
                        //console.log(e)
                    }
                }
            }
        }
    })        
}