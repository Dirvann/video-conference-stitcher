declare const _default: {
    execute(command: string, log?: boolean): Promise<any>;
    /**
     * pipes the given value to the process run by the command
     * @param value
     *        string to pipe
     * @param command
     *        command the value will be piped to
     * @param log
     */
    pipeExec(value: string, command: string, log?: boolean): Promise<any>;
};
export default _default;
