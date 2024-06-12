const production = {
    API_URL: "https://kmk510.store",
};

const development = {
    API_URL: "https://kmk510.store",
};

module.exports =
    process.env.NODE_ENV === "production" ? production : development;