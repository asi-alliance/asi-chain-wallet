export const ignorePropsForDOMElement = <P extends Record<string, any>>(
    styleProps: (keyof P)[],
) => ({
    shouldForwardProp: (prop: string) => !styleProps.includes(prop as keyof P),
});
