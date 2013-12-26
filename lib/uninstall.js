#!/usr/bin/env node


var argv = require('commander')
var fs = require('fs')
var rimraf = require('rimraf')

fs.readdir(process.cwd() + '/modules/'+ argv.uninstall, function(err,files){
    if (typeof files === 'object')
        uninstallModule(argv.uninstall)
    else {
        console.log('Module not installed. Nothing to do!')
    }
})   

function uninstallModule(name){
    //Try to uninstall package
    console.log('Uninstalling ' + name + '...')
    try{
         rimraf(process.cwd() + '/modules/'+ argv.uninstall, function(){
            console.log('Module ' + name +' successfully unistalled!')
         })         
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

