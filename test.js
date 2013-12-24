/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var bower = require('bower')
var util = require('util')
var module = 'jquery/jquery#1.10.2'

//bower.commands
//    .info(module)
//    .on('end', function (info) {
//        //console.log('i'+ util.inspect(info, false, null))
//        var hp
//        if (module.indexOf('#') > -1)
//            hp = info.homepage
//        else
//            hp = info.latest.homepage
//        getHome(hp)
//    })
//    .on('error', function (error) {
//        console.log('e'+error)
//    });                

function getHome(url){
    console.log(url)
    var request = require('request');
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            getTree(body) // Print the google web page.
        }
    })    
}

function getTree(body){
    var cheerio = require('cheerio'),
    $ = cheerio.load(body)
    var tree = {}
    var files = $('table.files').find('td.content').find('a')
    $(files).each(function(i, elem) {
        tree[$(this).text()] = $(this).attr('href')
    })

}

var github = require('octonode');
var client = github.client();

client.get('/users/pksunkara', {}, function (err, status, body, headers) {
  console.log(body); //json object
});