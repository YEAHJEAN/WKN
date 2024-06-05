const production = {
    API_URL: "43.202.124.253",
};

const development = {
    API_URL: "43.202.124.253",
};

module.exports =
    process.env.NODE_ENV === "production" ? production : development;