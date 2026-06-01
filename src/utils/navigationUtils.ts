interface IQueryParam {
    key: string;
    value: string;
}

interface IUrlParamConfig {
    pathParams?: string[];
    queryParams?: IQueryParam[];
}

interface IQueryParam {
    key: string;
    value: string;
}

interface IUrlParamConfig {
    pathParams?: string[];
    queryParams?: IQueryParam[];
}

export const buildUrlWithParams = (
    prefix: string,
    { pathParams, queryParams }: IUrlParamConfig,
): string => {
    let url = prefix;

    if (pathParams && pathParams.length > 0) {
        url = `${url}/${pathParams.join("/")}`;
    }

    if (queryParams && queryParams.length > 0) {
        const searchParams = new URLSearchParams();

        queryParams.forEach(({ key, value }) => {
            if (key && value !== undefined && value !== null) {
                searchParams.append(key, value);
            }
        });

        const queryString = searchParams.toString();
        if (queryString) {
            url = `${url}?${queryString}`;
        }
    }

    return url;
};
