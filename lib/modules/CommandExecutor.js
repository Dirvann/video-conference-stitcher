"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const stream_1 = require("stream");
exports.default = {
    execute(command, log = false) {
        return new Promise(function (resolve, reject) {
            if (log)
                console.log('\n----- COMMAND -----\n', command.replace(/;/g, ';\\\n').replace(/color/g, '\ncolor') + '\n\n---- END COMMAND -----');
            const ls = child_process_1.spawn(command, [], { shell: true });
            ls.stdout.on('data', data => {
                if (log)
                    console.log(`stdout: ${data}`);
            });
            ls.stderr.on('data', data => {
                if (log)
                    console.log(`stderr: ${data}`);
            });
            ls.on('error', (error) => {
                if (log)
                    console.log(`error: ${error.message}`);
                reject();
            });
            ls.on('close', code => {
                if (log)
                    console.log(`child process exited with code ${code}`);
                resolve();
            });
        });
    },
    /**
     * pipes the given value to the process run by the command
     * @param value
     *        string to pipe
     * @param command
     *        command the value will be piped to
     * @param log
     */
    pipeExec(value, command, log = false) {
        return new Promise(function (resolve, reject) {
            // Pretty printing the command in the terminal
            if (log)
                console.log('\n----- COMMAND -----\n', command
                    .replace('-filter_complex_script', '-filter_complex')
                    .replace('pipe:0', value)
                    .replace(/;/g, ';\\\n')
                    .replace(/color/g, '\ncolor')
                    .replace(/-i/g, '\\\n-i') + '\n---- END COMMAND -----\n');
            const process = child_process_1.spawn(command, [], { shell: true });
            const stream = new stream_1.Readable();
            // tslint:disable-next-line:no-empty
            stream._read = () => { };
            stream.push(value);
            stream.push(null);
            stream.resume();
            stream.pipe(process.stdin);
            process.stdout.on('data', data => {
                if (log)
                    console.log(`stdout: ${data}`);
            });
            process.stderr.on('data', data => {
                if (log)
                    console.log(`stderr: ${data}`);
            });
            process.on('error', (error) => {
                if (log)
                    console.log(`error: ${error.message}`);
                reject();
            });
            process.on('close', code => {
                if (log)
                    console.log(`child process exited with code ${code}`);
                resolve();
            });
        });
    }
};
//# sourceMappingURL=CommandExecutor.js.map