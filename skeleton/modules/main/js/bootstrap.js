/* 
 * Helper function for getting length of Objects
 */

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


/* 
 * Global object to track loaded modules and files
 * to avoid duplicated download
 */
var required = {
    'modules': ['jquery'],
    'files': [],
    'stack': []
}

/* 
 * Modules loader
 */

function require(name){
    var prefix = location.pathname
    if (required.modules.indexOf(name) < 0){
        $.getJSON(prefix + '/modules/'+name+'/package.json', function(data){
            //Deal with dependent modules
            var modules = data.dependencies;
            if (Object.size(modules) > 0){
                for (mod in modules){
                    if (required.modules.indexOf(mod) < 0){
                        require(mod);
                        //Stop actual require and add module to stack
                        required.stack.push(name);
                        return;
                    }
                }
            }
            //Deal with dependent files
            var data_urls = [],
                deps = data.main;
            if (typeof deps == 'string')
                data_urls.push(deps)
            else if (typeof deps == 'object')
                data_urls = deps;
            var len = data_urls.length;
            var i = 0;
            for (el in data_urls){
                var url = data_urls[el];
                if (required.files.indexOf(url) < 0){
                    //Get proper file
                    $.get(prefix + '/modules/'+name+'/'+data_urls[el])
                    .done(function(data) {
                        url = this.url;
                        var ext = url.split('.').pop();
                        switch(ext){
                            case 'php':
                            case 'html':
                            case 'tpl':
                                //this.appended
                                $(data).appendTo('body');
                                break;
                            case 'css':
                                $('<link/>')
                                .attr({
                                    'rel':'stylesheet',
                                    'href':url
                                }).appendTo('head');
                                break;
                        }
                        required.files.push(url);
                        //Check if all files are included
                        i += 1;
                        if (i == len) {
                            $("body").trigger(name+"ready");
                            console.log(name+" ready !");
                            required.modules.push(name);
                            
                            //Since module is ready check if there were modules dependent on it
                            if (required.stack.length >0){
                                require(required.stack.pop());
                            }
                                
                        }
                    }
                ).fail(function(data){console.log(data)});
                } else {
                    console.log('File '+url+' already loaded!');
                }//endif
            };
        });    
    } else {
        console.log('Module '+name+' already loaded!');
    }
}

/* 
 * Actual bootstrap function
 */
$(function(){
    require('main')
});