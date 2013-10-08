module.exports = exports = function (options, cmd, shell) {
    // If the command has pre-defined options then parse through them and validate against the supplied options.
    if (cmd.options) {

        var nonNamedIndex = 0;

        // Loop through the command's pre-defined options.
        for (var key in cmd.options) {

            // The option defined by the command.
            var definedOption = cmd.options[key];

            // If option has named=false, attach non-named parameters as option and remove from `options._` array.
            if (!options.hasOwnProperty(key) && definedOption.noName && options._.length > 0) {
                options[key] = options._[nonNamedIndex];
                options._.splice(nonNamedIndex, 1);
            }

            // If defined option was not supplied and it has aliases, check if aliases were supplied and attach option.
            if (!definedOption.noName && !options.hasOwnProperty(key) && definedOption.aliases) {
                definedOption.aliases.forEach(function (alias) {
                    if (alias in options) {
                        options[key] = options[alias];
                        delete options[alias];
                    }
                });
            }

            // If option has default value and was not found in supplied options then assign it.
            var defaultValue;
            if (definedOption.hasOwnProperty('default') && !options.hasOwnProperty(key)) {
                switch (typeof(definedOption.default)) {
                    case 'string':
                        options[key] = defaultValue = definedOption.default;
                        break;
                    case 'function':
                        options[key] = defaultValue = definedOption.default(shell, options);
                        break;
                }
            }

            // Prompt the user for value if:
            // A) The option was not supplied and it is required or
            // B) the option was supplied but without a value.
            if (definedOption.prompt) {
                if ((!options.hasOwnProperty(key) && definedOption.required)
                        || (options.hasOwnProperty(key) && options[key] === true)
                        || typeof(defaultValue) === 'undefined'
                        || defaultValue === null) {
                    shell.setPrompt(key, cmd.name, options);
                    if (definedOption.password)
                        shell.password();
                    if (typeof(definedOption.prompt) !== 'boolean')
                        shell.log(definedOption.prompt);
                    else
                        shell.log('Enter value for ' + key + '.');
                    // Return immediately without further validation.
                    return false;
                }
            }

            // If defined option has a validate expression or function and the option was supplied then
            // validate the supplied option against the expression or function.
            if (definedOption.validate && options.hasOwnProperty(key)) {

                // If defined validation is a regular expression then validate the supplied value against it.
                if (definedOption.validate instanceof RegExp) {
                    // If value does not pass validation then do not invoke command and write error message.
                    if (!definedOption.validate.test(options[key])) {
                        shell.error('invalid value for "' + key + '"');
                        return false;
                    }
                }
                // If defined validation is a function then pass the value to it.
                else if (typeof(definedOption.validate) == 'function') {
                    try {
                        // If the validation function returns false then do not invoke the command and write
                        // error message.
                        var validationResult = definedOption.validate(options[key], shell, options);
                        if (validationResult !== true) {
                            if (typeof(validationResult) !== 'string')
                                shell.error('invalid value for "' + key + '"');
                            else
                                shell.error(validationResult);
                            return false;
                        }
                    }
                        // If the provided validation function throws an error at any point then handle it
                        // gracefully and simply fail validation.
                    catch (ex) {
                        shell.error(ex.message);
                        return false;
                    }
                }
            }

            // If option is required but is not found in supplied options then error.
            if (definedOption.required && !options.hasOwnProperty(key)) {
                shell.error('missing parameter "' + key + '"');
                return false;
            }
        }
    }
    // If we made it this far then all options are valid so return true.
    return true;
};