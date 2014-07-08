// A similar-to-requirejs system for using define/require via the amd spec
// Things to remember:
//     no contexts in this implementation
//     requires jQuery to be loaded as the first module

// Used for filtering things before jake runs
if (typeof DEVMODE == 'undefined') {
    DEVMODE = true;
}

(function(window, undefined) {
    var unnamedModuleCounter = 0,
        modules = {},
        packages = {},
        toString = Object.prototype.toString,
        configOptions = {},
        moduleDfds = {},
        moduleScriptDfds = {},
        filesInProgress = {},
        funcClass = '[object Function]',
        stringClass = '[object String]',
        pathRedirects;

    var getModuleDeferred = function(name) {
        if (!moduleDfds[name]) {
            moduleDfds[name] = $.Deferred();
        }
        return moduleDfds[name];
    };
    var getModuleScriptDeferred = function(name) {
        var path = getPathForModule(name);
        return moduleScriptDfds[path];
    };
    var setPackages = function(packs) {
        packages = _.extend({}, packs);
    };
    var addPackages = function(packs) {
        packages = _.extend(packages, packs);
    };
    var getModulesExports = function(moduleNames, sourceModule) {
        var exports = [],
            name;
        for (var i = 0, l = moduleNames.length; i < l; i++) {
            name = moduleNames[i];
            exports.push(name == 'module' ? sourceModule : (name == 'exports' ? sourceModule.exports : modules[name].exports));
        }
        return exports;
    };
    var getPathForModule = function(name) {
        var module = modules[name],
            path = module && module.path;

        if (!module && packages[name]) {
            path = packages[name];
        }

        if (path) {
            path = resolvePath(path);
        }

        return path;
    };
    var resolveDependencies = function(name) {
        var module = modules[name],
            dependencies = module.dependencies || [],
            depName, depDfd, depMap;
        for (var i = 0, l = dependencies.length; i < l; i++) {
            depName = dependencies[i];
            depDfd = requireDeferred(depName);
            module.promises.push(depDfd.promise());
        }
    };
    var define = function define(name, dependencies, definition) {
        if (dependencies === undefined && toString.call(name) !== stringClass) {
            dependencies = [];
            definition = name;
            name = '__' + (unnamedModuleCounter++);
        } else if (definition === undefined) {
            definition = dependencies;
            if (_.isArray(name)) {
                dependencies = name;
                name = '__' + (unnamedModuleCounter++);
            } else {
                dependencies = [];
            }
        }
        var module = modules[name];
        if (module && !module.noDefinition) {
            return module;
        }

        module = module || {};
        dependencies = dependencies || [];
        if (dependencies.length == 0) {
            dependencies = ['require', 'exports', 'module'];
        }

        // TODO: move all of these to a private var instead of on the module
        module.definition = definition;
        module.dependencies = dependencies;
        module.dfd = getModuleDeferred(name);
        module.promises = [];
        module.exports = {};
        module.config = config;
        modules[name] = module;
        if (definition) {
            module.noDefinition = false;

            resolveDependencies(name);

            var self = this;
            $.when.apply($, module.promises).done(function() {
                try {
                    if (toString.call(definition) == stringClass) {
                        module.definition = Function(definition);
                        definition = module.definition;
                    }
                    if (toString.call(definition) == funcClass) {
                        var dependenciesExports = getModulesExports(dependencies, module);
                        definition.apply(self, dependenciesExports);
                    }
                } catch (e) {
                    console.log('module failed', name, e, e.stack);
                }
                module.dfd.resolve();
            }).fail(function() {
                console.log('module resolve failed', name, module);
            });
        } else {
            module.noDefinition = true;
        }

        return module;
    };
    var require = function(moduleName) {
        return modules[moduleName];
    };
    var requireDeferred = function(moduleName) {
        var dfd = getModuleDeferred(moduleName),
            path = getPathForModule(moduleName);

        var fail = function() {
            delete moduleDfds[moduleName];
            dfd.reject();
        };

        if (path && !filesInProgress[path] && dfd.state() != 'resolved') {
            filesInProgress[path] = 1;
            moduleScriptDfds[path] = $.ajax({
                url: path,
                cache: true,
                dataType: 'script'
            }).always(function() {
                delete filesInProgress[path];
            }).fail(fail);
        }

        // no path, fail!
        if (!path && dfd.state() != 'resolved') {
            fail();
        }

        return dfd;
    };
    var config = function(options) {
        configOptions = _.extend(configOptions, options);
        return configOptions;
    };

    var setupSpecialModule = function(name, exports) {
        modules[name] = {
            dfd: getModuleDeferred(name).resolve(),
            exports: exports
        };
    };
    setupSpecialModule('define', define);
    setupSpecialModule('require', require);
    setupSpecialModule('module', undefined);
    setupSpecialModule('exports', undefined);
    setupSpecialModule('global', window);

    var setPathRedirects = function(redirects) {
        if (redirects) {
            pathRedirects = redirects;
        }
    };
    var resolvePath = function(path) {
        if (!pathRedirects) {
            return path;
        }

        var pathParts = path.split('/'),
            pathKey,
            fileKey = '/' + pathParts[pathParts.length - 1];
        if (_.isObject(pathRedirects.fileMap) && pathRedirects.fileMap[fileKey]) {
            var fileMap = pathRedirects.fileMap[fileKey];
            if (fileMap && fileMap.length) {
                var newPath = fileMap[fileMap.length - 1].assetPath || '';
                if (newPath) {
                    pathParts = newPath.split('/');
                }
            }
        }
        if (pathParts.length < 2 || !_.isObject(pathRedirects.dirMap)) {
            return pathParts.join('/');
        }
        pathKey = pathParts[1];
        if (pathRedirects.dirMap[pathKey]) {
            pathParts[1] = pathRedirects.dirMap[pathKey];
        }

        return pathParts.join('/').replace('//', '/').replace(':/', '://');
    };

    // some custom things for this implementation
    var amdModules = {
        config: config,
        requireDeferred: requireDeferred,
        getModuleScriptDeferred: getModuleScriptDeferred,
        resolvePath: resolvePath,
        setPackages: setPackages,
        addPackages: addPackages,
        setPathRedirects: setPathRedirects
    };
    if (DEVMODE) {
        amdModules.modules = modules;
        amdModules.packages = packages;
    }

    // regular required amd exports
    define.amd = {jQuery: true};
    window.define = define;
    window.require = require;
    window.amdModules = amdModules;
})(window);