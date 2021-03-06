const cheerio = require("cheerio");
const rp = require("request-promise");
const AWS = require("aws-sdk");

exports.get = (event, context, callback) => {
    rp({
        method: "GET",
        uri: "https://www.abc.virginia.gov/products/limited-availability",
        headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
        },
        transform: (body) => {
            return cheerio.load(body);
        }
    }).then($ => {
        const distributions = [];

        $(".content-body").find(".row").each((i, elem) => {
            const productAnchor = $(elem).find("div h3 a");
            const name = productAnchor.text();
            const productUrl = `https://www.abc.virginia.gov${productAnchor.attr("href")}`;
            const details = $(elem).find("div p").text().split("|");

            if (details[0].indexOf("LOTTERY IS CLOSED") === -1) {

                distributions.push({
                    name: name,
                    productUrl: productUrl,
                    // image: new Promise((resolve, reject) => {
                    //     rp({
                    //         method: "GET",
                    //         uri: productUrl,
                    //         headers: {
                    //             "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
                    //         },
                    //         transform: (body) => {
                    //             return cheerio.load(body);
                    //         }
                    //     }).then($$ => {
                    //         const image = `https://www.abc.virginia.gov${$$(".img-responsive").attr("src")}`;
                    //         resolve(image.substring(0, image.indexOf("?")));
                    //     }).catch(e => {
                    //         reject(e);
                    //     });
                    // }),
                    quantity: details[1].trim(),
                    price: details[2].trim(),
                    open: details[0].indexOf("ENTER") >= 0,
                    notification: $(elem).find("div span").text().trim()
                });
            }

        });

        console.log(`${distributions.length} entries found: ${JSON.stringify(distributions)}`);

        callback(null, {
            statusCode: 200,
            body: JSON.stringify(distributions),
            headers: {
                "Content-Type": "application/json"
            },
        });
    }).catch(e => {
        console.log(`There was an error retrieving current and open lotteries: ${e}`);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: e
            }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    });
};

exports.post = (event, context, callback) => {
    console.log(`Received event: ${event}`);

    const requestBody = JSON.parse(event.body);

    if (requestBody.accessToken) {
        const cognito = new AWS.CognitoIdentityServiceProvider();
        cognito.getUser({AccessToken: requestBody.accessToken}, (err, data) => {
            requestBody.email = data.Username;
            requestBody.firstName = data.UserAttributes.find((attribute) => attribute.Name === "given_name").Value;
            requestBody.lastName = data.UserAttributes.find((attribute) => attribute.Name === "family_name").Value;
            requestBody.phone = data.UserAttributes.find((attribute) => attribute.Name === "phone_number").Value;
            requestBody.storeNumber = data.UserAttributes.find((attribute) => attribute.Name === "custom:store_numb").Value;
            requestBody.storeAddress = data.UserAttributes.find((attribute) => attribute.Name === "custom:store_address").Value;
        });
    }


};
