#!/usr/bin/env node

var argv = require('commander')
var pkg = require('../package.json')

argv
    .version(pkg.version)
    .option('-I, --init', 'Create a new project')
    .option('-i, --install [module]', 'Install modules')
    .option('-u, --uninstall [module]', 'Uninstall module')
    .option('-up, --update [module]', 'Update module')
    .option('-c, --clear [module]', 'Clear module if possible')
    .option('-s, --save', 'Save module as a dependency')
    .option('-d, --dirty', 'Keep the modules folder dirty')
    .parse(process.argv)

if (argv.init){
    require('./init')
} else if (argv.install){
    var inst = require('./install')
    inst.install()
}else if (argv.uninstall){
    //To do
    require('./uninstall')
}else if (argv.clear){
    var inst = require('./install')
    inst.clearModule(argv.clear)
} else {
    console.log('Nothing to do! Need help?? Try "kiss --help"')
}
