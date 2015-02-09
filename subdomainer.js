/**
 * Subdomainer
 *
 * @type {Function}
 */
var subdomainer = module.exports = function (settingsFile) {
    var fs = require('fs'),
        util = require('util');

    //read & parse settings file
    var settings = JSON.parse(fs.readFileSync(settingsFile));
    /**
     * Add line to /etc/hosts
     * @param subdomain
     * @returns {boolean}
     */
    var addHostline = function (subdomain) {
        var hostLine = util.format('\n%s\t%s.%s\n', settings.hostname, subdomain, settings.domain);
        fs.appendFile(settings.etcHosts.file, hostLine, function (err) {
            console.error(err);
            return false;
        });
        return true;
    };

    /**
     * Add Virtual host to apache file
     * @param subdomain
     * @param params
     */
    var addVhost = function (subdomain, params) {
        var tagReplacer = function(string){
            string = string
                            .replace("{subdomain}", subdomain)
                            .replace("{domain}", settings.domain);
            //@TODO possibly add more params
            return string;
        };
        var block = function(blockname, blockValue, params){
            blockValue = tagReplacer(blockValue);
            var _block = util.format('\n<%s "%s">{{params}}</%s>\n', blockname, blockValue, blockname);
            var _params = "\n";
            if(typeof params._value !== 'undefined')
                delete params._value;
            for (var param in params) {
                if (params.hasOwnProperty(param)) {
                    var placeholder = "%s ";
                    if (typeof params[param] === "string") {
                        switch (param) {
                            case "DocumentRoot":
                                placeholder += '"%s"';
                                break;
                            case "ServerName":
                                placeholder += '%s';
                                break;
                            //@TODO add another params with special formatting
                            default :
                                placeholder += "%s"; //default formatting
                        }
                        params[param] = tagReplacer( params[param] );
                        _params += "\t" + util.format(placeholder, param, params[param]) + "\n";
                    } else if( Object.prototype.toString.call( params[param] ) === '[object Array]' ) {
                        for(var p in params[param]){
                            _params += block(param, params[param][p]._value, params[param][p]);
                        }
                    } else {
                        _params += block(param, params[param]._value, params[param]);
                    }
                }
            }
            _block = _block.replace("{{params}}", _params);
            return _block;
        };
        /*for (var _prefix in settings.vconf.prefixes) {
            var prefix = settings.vconf.prefixes[_prefix];
            if (prefix != "") prefix += ".";*/
            var virtualHost = tagReplacer( settings.vconf.VirtualHost );
            var vhost = block("VirtualHost", virtualHost, settings.vconf.params);
            console.log(vhost);
            fs.appendFile(settings.vconf.file, vhost, function (err) {
                console.error(err);
                return false;
            });
        //}
        return true;
    };
    /**
     * Add another subdomain
     * @param subdomain
     */
    this.addSubdomain = function (subdomain) {
        // Append line to /etc/hosts
        var completed = 0;
        if (addHostline(subdomain)) completed++;
        if (addVhost(subdomain)) completed++;

        if (completed == 2)
            return true;
        else return false;
    };
};
