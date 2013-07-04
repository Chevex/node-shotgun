exports.description = 'Allows a user to authenticate to the system with the supplied credentials.';

exports.usage = '[username] [password]';

exports.options = {
    username: {
        nodash: true,
        description: 'Your username.'
    },
    password: {
        nodash: true,
        description: 'Your password.'
    }
};

exports.invoke = function (options, shell) {
    var res = this;
    if (options.username.toLowerCase() === 'charlie' && options.password === 'password123')
        res.log('Success!');
    else
        res.error('Username or password incorrect.');
};