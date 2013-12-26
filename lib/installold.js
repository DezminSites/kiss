#!/usr/bin/env node

/*
 * Alternative way to install modules
 * using Bower
 */

var argv = require('commander')
var fs = require('fs')
var bower = require('bower')
var util = require('util')
var glob = require("glob")
var path = require('path')


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

function installModule(name,save,dirty){
    //Try to install package
    console.log('Installing ' + name + '...')
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
    console.log('Cleaning ' + name + '...')
    var filetype, 
        nomain = false
    try {
        var file = require(process.cwd() + '/modules/'+name+'/package.json')
        filetype = 'package'
    } catch(e){}
    if (typeof file == 'undefined'){
        try {
            var file = require(process.cwd() + '/modules/'+name+'/bower.json')
            filetype = 'bower'
            //Create package if none exists
            fs.writeFileSync(process.cwd() + '/modules/'+name+'/package.json', JSON.stringify(file, null, "  "))
        } catch(e){}
    }
    if (typeof file != 'undefined'){
        var main = file.main
    }
    if (typeof main == 'undefined'){
        console.log('No main attr. Module will stay dirty! =(')
        console.log('Create main prop?')
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
                        //console.log(path.dirname(files[f]))
                        fs.rmdirSync(path.dirname(files[f]))
                    }catch(e){
                        //console.log(e)
                    }
                }
            }
        }
    })        
}
