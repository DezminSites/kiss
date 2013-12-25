#!/usr/bin/env node

var argv = require('commander')
var fs = require('fs')
var bower = require('bower')
var util = require('util')
var glob = require("glob")
var path = require('path')

var patt1 = new RegExp(/(?:.*\/)?(.*?)(?:#.+|$)/)
var mname = patt1.exec(argv.install)[1]

function install(name){
    if (typeof name == 'string'){
        argv.install = name
        mname = patt1.exec(argv.install)[1]
        console.log('change to '+ mname)
    }
        
    fs.readdir(process.cwd() + '/modules/'+ mname, function(err,files){
        if (typeof files === 'object')
            console.log('Module '+mname+' already installed. Nothing to do!')
        else {
            if (typeof argv.install === 'boolean')
                installAll(argv.save,argv.dirty)
            else
                installModule(argv.install,argv.save,argv.dirty)
        }
    })   
}

module.exports = install

function installAll(save,dirty){
    var pkg = require(process.cwd()+'/package.json')
    var deps = pkg.dependencies
    for (d in deps){
        console.log(d)
        //mname = argv.install = d
        //require('./install')()
        install(d)
    }
}

function installModule(name,save,dirty){
    //Try to install package
    console.log('Searching for ' + mname + '...')
    try{
        bower.commands
        .info(name)
        .on('end', function (info) {
            //console.log(info)            
            if (typeof info.latest == 'object')
                var url = info.latest.homepage
            else
                var url = info.homepage
                
            parseUrl(name,save,dirty,url)
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

function parseUrl(name,save,dirty,url){
    console.log('Fetching ' + url + '...')
    var request = require('request')
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            getTree(body,url) // Print the google web page.
        } else {
            throwError()
        }
    })    
}

function getTree(body,url){
    var cheerio = require('cheerio'),
    $ = cheerio.load(body)
    var tree = {}
    var files = $('table.files').find('td.content').find('a')
    $(files).each(function(i, elem) {
        tree[$(this).text()] = $(this).attr('href')
    })
    getJson(tree,url)
}

function getJson(tree,url){
    var pkg,bower
    for (node in tree){
        if (node == 'package.json'){}
        if (node == 'bower.json'){}
    }
    if (typeof pkg == 'undefined' && typeof bower == 'undefined')
        downloadRepo(url)
}

function downloadRepo(url){
    console.log('Downloading full repo ' + url + '...')
    var request = require('request')
    var req = request(url+'/archive/master.zip')
    req.on('response', function (resp) {
        if (resp.statusCode == 200){
            fs.mkdir(process.cwd() + '/modules/'+mname)
            var writable = fs.createWriteStream(process.cwd() + '/modules/'+mname+"/master.zip")
            req.pipe(writable)
            writable.on('finish',function(){
                unpackRepo()
            })
        }
        else
            throwError()
    })
}

function unpackRepo(){
    console.log('Unpacking ' + mname + '...')
    var AdmZip = require('adm-zip')
    var zip = new AdmZip(process.cwd() + '/modules/'+mname+"/master.zip")
    var zipEntries = zip.getEntries()
    
    zipEntries.forEach(function(zipEntry) {
        var entryNameArr = zipEntry.entryName.split('/')
        var entryName = entryNameArr.slice(1).join('/')
        zip.extractEntryTo(zipEntry.entryName, process.cwd() + '/modules/'+mname+"/"+entryName, /*maintainEntryPath*/false, /*overwrite*/true)
        fs.unlinkSync(process.cwd() + '/modules/'+mname+"/master.zip")
        console.log(mname + ' successfully installed!')
        postInstall(mname)
    })
    
}

function throwError(){
    var msg = 'Ops... Something went wrong... Are you sure this package is available?'
    console.log(msg)
}

function postInstall(name){
    if (!argv.dirty)
        clearModule(name)
    if (argv.save)
        saveModule(name)
}

function saveModule(name){
    console.log('Adding ' + name + ' as a dependency...')
    var pkg = require(process.cwd()+'/package.json')
    var mod = require(process.cwd()+'/modules/'+name+'/package.json')
    var version = mod.version
    if (typeof version == 'undefined')
        version = '*'
    if (typeof pkg.dependencies == 'undefined')
        pkg.dependencies = {}
    pkg.dependencies[name] = version
    fs.writeFileSync(process.cwd() + '/package.json', JSON.stringify(pkg, null, "  "))
}

function clearModule(name){
    console.log('Cleaning ' + name + '...')
    var module = process.cwd() + '/modules/'+name+ '/'
    try{
        var pkg = require(module + 'package.json')
    } catch(e){}
    
    try{
        var bow = require(module + 'bower.json')
    } catch(e){}
    
    if (typeof pkg == 'undefined' && typeof bow != 'undefined'){
        pkg = bow
        fs.writeFileSync(process.cwd() + '/modules/'+name+'/package.json', JSON.stringify(pkg, null, "  "))
    } else if (typeof pkg.main == 'undefined' && typeof bow.main != 'undefined'){
        pkg.main = bow.main
        fs.writeFileSync(process.cwd() + '/modules/'+name+'/package.json', JSON.stringify(pkg, null, "  "))
    }
        
    if (typeof pkg.main == 'undefined'){
        console.log('No main attr. Module will stay dirty! =(')
        return
    } else {
        deleteFiles(name,pkg.main)
    }
}

module.exports.clear = clearModule

function deleteFiles(name,main){
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

function makeGlob(name,arr){
    // options is optional
    glob(process.cwd() + '/modules/'+name+'/*',{mark: true, dot: true}, function (er, files) {
        for(f in files){
            //console.log('o:'+files[f])
            if(files[f].charAt(files[f].length - 1) == '/'){
                dir = files[f].split('/').slice(-2,-1)
                makeGlob(name+'/'+dir[0],arr)
            }
            else{
                files[f] = path.normalize(files[f])
                if (arr.indexOf(files[f]) > -1 || arr.indexOf(files[f].substr(1)) > -1){
                    //console.log('k:'+files[f])
                }else{
                    if (files[f].indexOf('package.json') < 0 && files[f].indexOf('bower.json') < 0 && files[f].indexOf('composer.json') < 0)
                        fs.unlinkSync(files[f])
                    //console.log('d:'+files[f])
                    var dir = path.dirname(files[f])
                    while (dir){
                        try{
                            fs.rmdirSync(dir)
                            dir = path.dirname(dir)
                        } catch (e) {
                            dir = false
                        }
                    }
                }
            }
        }
    })        
}
