#!/usr/bin/env node

var argv = require('commander')
var fs = require('fs')
var bower = require('bower')
var util = require('util')
var glob = require("glob")
var path = require('path')

function InstallInit(){
    this.argvi = argv.install
    this.patt1 = new RegExp(/(?:.*\/)?(.*?)(?:#.+|$)/)
    this.mname = this.patt1.exec(this.argvi)[1]
    
    this.install = function(name){ //the Main install function
        var that = this
        if (typeof name == 'string'){
            that.argvi = name
            that.mname = that.patt1.exec(that.argvi)[1]
        }
        
        fs.readdir(process.cwd() + '/modules/'+ that.mname, function(err,files){
            if (typeof files === 'object')
                console.log('Module '+that.mname+' already installed. Nothing to do!')
            else {
                if (typeof that.argvi === 'boolean')
                    that.installAll(argv.save,argv.dirty)
                else
                    that.installModule(that.argvi,argv.save,argv.dirty)
            }
        })   
    }
    
    this.installAll = function(save,dirty){//Install all modules described in pkg manifest
        var that = this
        var pkg = require(process.cwd()+'/package.json')
        var deps = pkg.dependencies
        var inst = {}
        for (d in deps){
            inst[d] = new InstallInit()
            inst[d].install(d)
        }
    }
    
    this.installModule = function(name,save,dirty){ //Begin install action
        var that = this
        console.log('Searching for ' + that.mname + '...')
        try{
            bower.commands
            .info(name)
            .on('end', function (info) {
                //console.log(info)            
                if (typeof info.latest == 'object')
                    var url = info.latest.homepage
                else
                    var url = info.homepage
                
                that.parseUrl(name,save,dirty,url)
            })
            .on('error', function (error) {
                that.throwError()
            });                
        } catch(e){
            that.throwError()
        }
    
        process.on('uncaughtException', function (exception) {
            // handle or ignore error
        });            

    }
    
    this.parseUrl = function(name,save,dirty,url){//Parse repo url
        var that = this
        console.log('Fetching ' + url + '...')
        var request = require('request')
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                that.getTree(body,url) // Print the google web page.
            } else {
                that.throwError()
            }
        })    
        
    }
    
    this.getTree = function(body,url){
        var that = this
        var cheerio = require('cheerio'),
        $ = cheerio.load(body)
        var tree = {}
        var files = $('table.files').find('td.content').find('a')
        $(files).each(function(i, elem) {
            tree[$(this).text()] = $(this).attr('href')
        })
        that.getJson(tree,url)
    }
    
    this.getJson = function(tree,url){ //Get repo file tree
        var that = this
        var pkg,bower
        for (node in tree){
            if (node == 'package.json'){}
            if (node == 'bower.json'){}
        }
        if (typeof pkg == 'undefined' && typeof bower == 'undefined')
            that.downloadRepo(url)
    }

    this.downloadRepo = function(url){//Download github repo
        var that = this
        console.log('Downloading full repo ' + url + '...')
        var request = require('request')
        var req = request(url+'/archive/master.zip')
        req.on('response', function (resp) {
            if (resp.statusCode == 200){
                fs.mkdir(process.cwd() + '/modules/'+that.mname)
                var writable = fs.createWriteStream(process.cwd() + '/modules/'+that.mname+"/master.zip")
                req.pipe(writable)
                writable.on('finish',function(){
                    that.unpackRepo()
                })
            }
            else
                that.throwError()
        })
    }

    this.unpackRepo = function(){//Unpack repo zip
        var that = this
        console.log('Unpacking ' + that.mname + '...')
        var AdmZip = require('adm-zip')
        var zip = new AdmZip(process.cwd() + '/modules/'+that.mname+"/master.zip")
        var zipEntries = zip.getEntries()
    
        zipEntries.forEach(function(zipEntry) {
            var entryNameArr = zipEntry.entryName.split('/')
            var entryName = entryNameArr.slice(1).join('/')
            zip.extractEntryTo(zipEntry.entryName, process.cwd() + '/modules/'+that.mname+"/"+entryName, /*maintainEntryPath*/false, /*overwrite*/true)
            fs.unlinkSync(process.cwd() + '/modules/'+that.mname+"/master.zip")
            console.log(that.mname + ' successfully installed!')
            that.postInstall(that.mname)
        })
    
    }

    this.throwError = function(){// Throw error if sth goes wrong
        var msg = 'Ops... Something went wrong... Are you sure this package is available?'
        console.log(msg)
    }

    this.postInstall = function(name){
        var that = this
        if (!argv.dirty)
            that.clearModule(name)
        if (argv.save)
            that.saveModule(name)
    }

    this.saveModule = function(name){//Save module to pkg
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

    this.clearModule = function(name){ //Init module clear
        var that = this
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
            that.deleteFiles(name,pkg.main)
        }
    }    
    
    this.deleteFiles = function(name,main){//Prepare files for deletion
        var that = this
        var arr = []
        if(typeof main == 'string')
            arr.push(path.normalize(process.cwd() + '/modules/'+name+'/'+main))
        else if (typeof main == 'object'){
            for (o in main){
                arr.push(path.normalize(process.cwd() + '/modules/'+name+'/'+main[o]))
            }
        }
        that.makeGlob(name,arr)
    }

    this.makeGlob = function (name,arr){ //Do delete files
        var that = this
        glob(process.cwd() + '/modules/'+name+'/*',{mark: true, dot: true}, function (er, files) {
            for(f in files){
                //console.log('o:'+files[f])
                if(files[f].charAt(files[f].length - 1) == '/'){
                    dir = files[f].split('/').slice(-2,-1)
                    that.makeGlob(name+'/'+dir[0],arr)
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
}

module.exports = new InstallInit
