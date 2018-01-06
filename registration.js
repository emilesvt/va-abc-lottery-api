const AWS = require("aws-sdk");
const uuid = require("uuid");
const ddb = new AWS.DynamoDB.DocumentClient();

exports.post = (event, context, callback) => {
    console.log(`Received event: ${event}`);

    const requestBody = JSON.parse(event.body);
    const accessToken = uuid.v4();
    const item = {
        access_token: accessToken,
        first_name: requestBody.first_name,
        last_name: requestBody.last_name,
        email: requestBody.email,
        phone: requestBody.phone,
        store_num: requestBody.store_num,
        store_address: requestBody.store_address
    };

    ddb.put({
        TableName: 'Users',
        Item: item,
    }).promise().then(() => {
        callback(null, {
            statusCode: 201,
            body: JSON.stringify(item),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }).catch(e => {
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

exports.get = (event, context, callback) => {
    console.log(`Received event: ${JSON.stringify(event)}`);

    let accessToken;
    if (event.pathParameters !== null && event.pathParameters !== undefined) {
        if (event.pathParameters.access_token !== undefined &&
            event.pathParameters.access_token !== null &&
            event.pathParameters.access_token !== "") {
            console.log(`Received access_token: ${event.pathParameters.access_token}`);
            accessToken = event.pathParameters.access_token;
        }
    }

    ddb.get({
        TableName: 'Users',
        Key: {
            access_token: accessToken,
        },
    }).promise().then((item) => {
        console.log(`item from sql call: ${JSON.stringify(item)}`);

        if (item.Item) {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(item.Item),
                headers: {
                    "Content-Type": "application/json"
                },
            });
        } else {
            callback(null, {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json"
                },
            });
        }
    }).catch(e => {
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