

export type ObserverConfig = {
    name: string;
    url: string;
};

export const createObserver = (config: ObserverConfig) => {
    return {
        name: config.name,
        url: config.url
    };
};
