const CryptoJS = require('crypto-js');
const excludedServices = ['users', 'authentication'];

function encryptData(app, data) {
    const SECRET_KEY = app.get('authentication').secret;
    try {
        if (!data) throw new Error('No data provided for encryption');
        const ciphertext = CryptoJS.AES.encrypt(
            JSON.stringify(data),
            SECRET_KEY
        ).toString();
        return ciphertext;
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

function decryptData(app, ciphertext) {
    const SECRET_KEY = app.get('authentication').secret;
    try {
        if (!ciphertext)
            throw new Error('No ciphertext provided for decryption');
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const deciphertext = bytes.toString(CryptoJS.enc.Utf8);
        if (!deciphertext) throw new Error('Decryption failed - empty result');
        return JSON.parse(deciphertext);
    } catch (error) {
        console.error('Decryption error:', error);
        throw error;
    }
}

// FeathersJS Hook - Encrypt Response
const encryptResponse = (context) => {
    const { result, app, path } = context;
    if (excludedServices.includes(path)) return context;
    context.result = { encrypted: encryptData(app, result) };
    return context;
};

// FeathersJS Hook - Decrypt Request
const decryptRequest = (context) => {
    const { data, app, path, params } = context;
    if (excludedServices.includes(path)) return context;
    if (params && params.query) {
        context.params.query = params.query.encrypted
            ? decryptData(app, params.query.encrypted)
            : params.query;
    }
    if (data) {
        context.data = data.encrypted ? decryptData(app, data.encrypted) : data;
    }
    return context;
};

module.exports = {
    encryptData,
    decryptData,
    encryptResponse,
    decryptRequest
};
