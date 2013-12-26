#!/usr/bin/env node


var argv = require('commander')
var fs = require('fs')

fs.readdir(process.cwd() + '/modules/', function(err,files){
    if (typeof files === 'object'){
        console.log('Modules installed:\n')
        for (f in files)
            console.log(files[f])
    } else {
        console.log('No modules to show!')
    }
})   


