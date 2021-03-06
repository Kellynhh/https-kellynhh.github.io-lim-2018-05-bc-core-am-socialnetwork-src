/*! firebase-admin v5.13.1 */
"use strict";
/*!
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var deep_copy_1 = require("./deep-copy");
var error_1 = require("./error");
var validator = require("./validator");
var http = require("http");
var https = require("https");
var url = require("url");
var DefaultHttpResponse = /** @class */ (function () {
    /**
     * Constructs a new HttpResponse from the given LowLevelResponse.
     */
    function DefaultHttpResponse(resp) {
        this.status = resp.status;
        this.headers = resp.headers;
        this.text = resp.data;
        try {
            this.parsedData = JSON.parse(resp.data);
        }
        catch (err) {
            this.parsedData = undefined;
            this.parseError = err;
        }
        this.request = resp.config.method + " " + resp.config.url;
    }
    Object.defineProperty(DefaultHttpResponse.prototype, "data", {
        get: function () {
            if (typeof this.parsedData !== 'undefined') {
                return this.parsedData;
            }
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.UNABLE_TO_PARSE_RESPONSE, "Error while parsing response data: \"" + this.parseError.toString() + "\". Raw server " +
                ("response: \"" + this.text + "\". Status code: \"" + this.status + "\". Outgoing ") +
                ("request: \"" + this.request + ".\""));
        },
        enumerable: true,
        configurable: true
    });
    return DefaultHttpResponse;
}());
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(response) {
        var _this = _super.call(this, "Server responded with status " + response.status + ".") || this;
        _this.response = response;
        // Set the prototype so that instanceof checks will work correctly.
        // See: https://github.com/Microsoft/TypeScript/issues/13965
        Object.setPrototypeOf(_this, HttpError.prototype);
        return _this;
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
var HttpClient = /** @class */ (function () {
    function HttpClient() {
    }
    /**
     * Sends an HTTP request to a remote server. If the server responds with a successful response (2xx), the returned
     * promise resolves with an HttpResponse. If the server responds with an error (3xx, 4xx, 5xx), the promise rejects
     * with an HttpError. In case of all other errors, the promise rejects with a FirebaseAppError. If a request fails
     * due to a low-level network error, transparently retries the request once before rejecting the promise.
     *
     * If the request data is specified as an object, it will be serialized into a JSON string. The application/json
     * content-type header will also be automatically set in this case. For all other payload types, the content-type
     * header should be explicitly set by the caller. To send a JSON leaf value (e.g. "foo", 5), parse it into JSON,
     * and pass as a string or a Buffer along with the appropriate content-type header.
     *
     * @param {HttpRequest} request HTTP request to be sent.
     * @return {Promise<HttpResponse>} A promise that resolves with the response details.
     */
    HttpClient.prototype.send = function (config) {
        return this.sendWithRetry(config);
    };
    /**
     * Sends an HTTP request, and retries it once in case of low-level network errors.
     */
    HttpClient.prototype.sendWithRetry = function (config, attempts) {
        var _this = this;
        if (attempts === void 0) { attempts = 0; }
        return sendRequest(config)
            .then(function (resp) {
            return new DefaultHttpResponse(resp);
        }).catch(function (err) {
            var retryCodes = ['ECONNRESET', 'ETIMEDOUT'];
            if (retryCodes.indexOf(err.code) !== -1 && attempts === 0) {
                return _this.sendWithRetry(config, attempts + 1);
            }
            if (err.response) {
                throw new HttpError(new DefaultHttpResponse(err.response));
            }
            if (err.code === 'ETIMEDOUT') {
                throw new error_1.FirebaseAppError(error_1.AppErrorCodes.NETWORK_TIMEOUT, "Error while making request: " + err.message + ".");
            }
            throw new error_1.FirebaseAppError(error_1.AppErrorCodes.NETWORK_ERROR, "Error while making request: " + err.message + ". Error code: " + err.code);
        });
    };
    return HttpClient;
}());
exports.HttpClient = HttpClient;
/**
 * Sends an HTTP request based on the provided configuration. This is a wrapper around the http and https
 * packages of Node.js, providing content processing, timeouts and error handling.
 */
function sendRequest(config) {
    return new Promise(function (resolve, reject) {
        var data;
        var headers = config.headers || {};
        if (config.data) {
            if (validator.isObject(config.data)) {
                data = new Buffer(JSON.stringify(config.data), 'utf-8');
                if (typeof headers['Content-Type'] === 'undefined') {
                    headers['Content-Type'] = 'application/json;charset=utf-8';
                }
            }
            else if (validator.isString(config.data)) {
                data = new Buffer(config.data, 'utf-8');
            }
            else if (validator.isBuffer(config.data)) {
                data = config.data;
            }
            else {
                return reject(createError('Request data must be a string, a Buffer or a json serializable object', config));
            }
            // Add Content-Length header if data exists
            headers['Content-Length'] = data.length.toString();
        }
        var parsed = url.parse(config.url);
        var protocol = parsed.protocol || 'https:';
        var isHttps = protocol === 'https:';
        var options = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.path,
            method: config.method,
            headers: headers,
        };
        var transport = isHttps ? https : http;
        var req = transport.request(options, function (res) {
            if (req.aborted) {
                return;
            }
            // Uncompress the response body transparently if required.
            var respStream = res;
            var encodings = ['gzip', 'compress', 'deflate'];
            if (encodings.indexOf(res.headers['content-encoding']) !== -1) {
                // Add the unzipper to the body stream processing pipeline.
                var zlib = require('zlib');
                respStream = respStream.pipe(zlib.createUnzip());
                // Remove the content-encoding in order to not confuse downstream operations.
                delete res.headers['content-encoding'];
            }
            var response = {
                status: res.statusCode,
                headers: res.headers,
                request: req,
                data: undefined,
                config: config,
            };
            var responseBuffer = [];
            respStream.on('data', function (chunk) {
                responseBuffer.push(chunk);
            });
            respStream.on('error', function (err) {
                if (req.aborted) {
                    return;
                }
                reject(enhanceError(err, config, null, req));
            });
            respStream.on('end', function () {
                var responseData = Buffer.concat(responseBuffer).toString();
                response.data = responseData;
                finalizeRequest(resolve, reject, response);
            });
        });
        // Handle errors
        req.on('error', function (err) {
            if (req.aborted) {
                return;
            }
            reject(enhanceError(err, config, null, req));
        });
        if (config.timeout) {
            // Listen to timeouts and throw an error.
            req.setTimeout(config.timeout, function () {
                req.abort();
                reject(createError("timeout of " + config.timeout + "ms exceeded", config, 'ETIMEDOUT', req));
            });
        }
        // Send the request
        req.end(data);
    });
}
/**
 * Creates a new error from the given message, and enhances it with other information available.
 */
function createError(message, config, code, request, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, request, response);
}
/**
 * Enhances the given error by adding more information to it. Specifically, the HttpRequestConfig,
 * the underlying request and response will be attached to the error.
 */
function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
        error.code = code;
    }
    error.request = request;
    error.response = response;
    return error;
}
/**
 * Finalizes the current request in-flight by either resolving or rejecting the associated promise. In the event
 * of an error, adds additional useful information to the returned error.
 */
function finalizeRequest(resolve, reject, response) {
    if (response.status >= 200 && response.status < 300) {
        resolve(response);
    }
    else {
        reject(createError('Request failed with status code ' + response.status, response.config, null, response.request, response));
    }
}
var AuthorizedHttpClient = /** @class */ (function (_super) {
    __extends(AuthorizedHttpClient, _super);
    function AuthorizedHttpClient(app) {
        var _this = _super.call(this) || this;
        _this.app = app;
        return _this;
    }
    AuthorizedHttpClient.prototype.send = function (request) {
        var _this = this;
        return this.app.INTERNAL.getToken().then(function (accessTokenObj) {
            var requestCopy = deep_copy_1.deepCopy(request);
            requestCopy.headers = requestCopy.headers || {};
            var authHeader = 'Authorization';
            requestCopy.headers[authHeader] = "Bearer " + accessTokenObj.accessToken;
            return _super.prototype.send.call(_this, requestCopy);
        });
    };
    return AuthorizedHttpClient;
}(HttpClient));
exports.AuthorizedHttpClient = AuthorizedHttpClient;
/**
 * Base class for handling HTTP requests.
 */
var HttpRequestHandler = /** @class */ (function () {
    function HttpRequestHandler() {
    }
    /**
     * Sends HTTP requests and returns a promise that resolves with the result.
     * Will retry once if the first attempt encounters an AppErrorCodes.NETWORK_ERROR.
     *
     * @param {string} host The HTTP host.
     * @param {number} port The port number.
     * @param {string} path The endpoint path.
     * @param {HttpMethod} httpMethod The http method.
     * @param {object} [data] The request JSON.
     * @param {object} [headers] The request headers.
     * @param {number} [timeout] The request timeout in milliseconds.
     * @return {Promise<object>} A promise that resolves with the response.
     */
    HttpRequestHandler.prototype.sendRequest = function (host, port, path, httpMethod, data, headers, timeout) {
        var _this = this;
        // Convenience for calling the real _sendRequest() method with the original params.
        var sendOneRequest = function () {
            return _this._sendRequest(host, port, path, httpMethod, data, headers, timeout);
        };
        return sendOneRequest()
            .catch(function (response) {
            // Retry if the request failed due to a network error.
            if (response.error instanceof error_1.FirebaseAppError) {
                if (response.error.hasCode(error_1.AppErrorCodes.NETWORK_ERROR)) {
                    return sendOneRequest();
                }
            }
            return Promise.reject(response);
        });
    };
    /**
     * Sends HTTP requests and returns a promise that resolves with the result.
     *
     * @param {string} host The HTTP host.
     * @param {number} port The port number.
     * @param {string} path The endpoint path.
     * @param {HttpMethod} httpMethod The http method.
     * @param {object} [data] The request JSON.
     * @param {object} [headers] The request headers.
     * @param {number} [timeout] The request timeout in milliseconds.
     * @return {Promise<object>} A promise that resolves with the response.
     */
    HttpRequestHandler.prototype._sendRequest = function (host, port, path, httpMethod, data, headers, timeout) {
        var requestData;
        if (data) {
            try {
                requestData = JSON.stringify(data);
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
        var options = {
            method: httpMethod,
            host: host,
            port: port,
            path: path,
            headers: headers,
        };
        // Only https endpoints.
        return new Promise(function (resolve, reject) {
            var req = https.request(options, function (res) {
                var buffers = [];
                res.on('data', function (buffer) { return buffers.push(buffer); });
                res.on('end', function () {
                    var response = Buffer.concat(buffers).toString();
                    var statusCode = res.statusCode || 200;
                    var responseHeaders = res.headers || {};
                    var contentType = responseHeaders['content-type'] || 'application/json';
                    if (contentType.indexOf('text/html') !== -1 || contentType.indexOf('text/plain') !== -1) {
                        // Text response
                        if (statusCode >= 200 && statusCode < 300) {
                            resolve(response);
                        }
                        else {
                            reject({
                                statusCode: statusCode,
                                error: response,
                            });
                        }
                    }
                    else {
                        // JSON response
                        try {
                            var json = JSON.parse(response);
                            if (statusCode >= 200 && statusCode < 300) {
                                resolve(json);
                            }
                            else {
                                reject({
                                    statusCode: statusCode,
                                    error: json,
                                });
                            }
                        }
                        catch (error) {
                            var parsingError = new error_1.FirebaseAppError(error_1.AppErrorCodes.UNABLE_TO_PARSE_RESPONSE, "Failed to parse response data: \"" + error.toString() + "\". Raw server" +
                                ("response: \"" + response + "\". Status code: \"" + res.statusCode + "\". Outgoing ") +
                                ("request: \"" + options.method + " " + options.host + options.path + "\""));
                            reject({
                                statusCode: statusCode,
                                error: parsingError,
                            });
                        }
                    }
                });
            });
            if (timeout) {
                // Listen to timeouts and throw a network error.
                req.on('socket', function (socket) {
                    socket.setTimeout(timeout);
                    socket.on('timeout', function () {
                        req.abort();
                        var networkTimeoutError = new error_1.FirebaseAppError(error_1.AppErrorCodes.NETWORK_TIMEOUT, host + " network timeout. Please try again.");
                        reject({
                            statusCode: 408,
                            error: networkTimeoutError,
                        });
                    });
                });
            }
            req.on('error', function (error) {
                var networkRequestError = new error_1.FirebaseAppError(error_1.AppErrorCodes.NETWORK_ERROR, "A network request error has occurred: " + (error && error.message));
                reject({
                    statusCode: 502,
                    error: networkRequestError,
                });
            });
            if (requestData) {
                req.write(requestData);
            }
            req.end();
        });
    };
    return HttpRequestHandler;
}());
exports.HttpRequestHandler = HttpRequestHandler;
/**
 * Class that extends HttpRequestHandler and signs HTTP requests with a service
 * credential access token.
 *
 * @param {Credential} credential The service account credential used to
 *     sign HTTP requests.
 * @constructor
 */
var SignedApiRequestHandler = /** @class */ (function (_super) {
    __extends(SignedApiRequestHandler, _super);
    function SignedApiRequestHandler(app_) {
        var _this = _super.call(this) || this;
        _this.app_ = app_;
        return _this;
    }
    /**
     * Sends HTTP requests and returns a promise that resolves with the result.
     *
     * @param {string} host The HTTP host.
     * @param {number} port The port number.
     * @param {string} path The endpoint path.
     * @param {HttpMethod} httpMethod The http method.
     * @param {object} data The request JSON.
     * @param {object} headers The request headers.
     * @param {number} timeout The request timeout in milliseconds.
     * @return {Promise} A promise that resolves with the response.
     */
    SignedApiRequestHandler.prototype.sendRequest = function (host, port, path, httpMethod, data, headers, timeout) {
        var _this = this;
        return this.app_.INTERNAL.getToken().then(function (accessTokenObj) {
            var headersCopy = (headers && deep_copy_1.deepCopy(headers)) || {};
            var authorizationHeaderKey = 'Authorization';
            headersCopy[authorizationHeaderKey] = 'Bearer ' + accessTokenObj.accessToken;
            return _super.prototype.sendRequest.call(_this, host, port, path, httpMethod, data, headersCopy, timeout);
        });
    };
    return SignedApiRequestHandler;
}(HttpRequestHandler));
exports.SignedApiRequestHandler = SignedApiRequestHandler;
/**
 * Class that defines all the settings for the backend API endpoint.
 *
 * @param {string} endpoint The Firebase Auth backend endpoint.
 * @param {HttpMethod} httpMethod The http method for that endpoint.
 * @constructor
 */
var ApiSettings = /** @class */ (function () {
    function ApiSettings(endpoint, httpMethod) {
        if (httpMethod === void 0) { httpMethod = 'POST'; }
        this.endpoint = endpoint;
        this.httpMethod = httpMethod;
        this.setRequestValidator(null)
            .setResponseValidator(null);
    }
    /** @return {string} The backend API endpoint. */
    ApiSettings.prototype.getEndpoint = function () {
        return this.endpoint;
    };
    /** @return {HttpMethod} The request HTTP method. */
    ApiSettings.prototype.getHttpMethod = function () {
        return this.httpMethod;
    };
    /**
     * @param {ApiCallbackFunction} requestValidator The request validator.
     * @return {ApiSettings} The current API settings instance.
     */
    ApiSettings.prototype.setRequestValidator = function (requestValidator) {
        var nullFunction = function (request) { return undefined; };
        this.requestValidator = requestValidator || nullFunction;
        return this;
    };
    /** @return {ApiCallbackFunction} The request validator. */
    ApiSettings.prototype.getRequestValidator = function () {
        return this.requestValidator;
    };
    /**
     * @param {ApiCallbackFunction} responseValidator The response validator.
     * @return {ApiSettings} The current API settings instance.
     */
    ApiSettings.prototype.setResponseValidator = function (responseValidator) {
        var nullFunction = function (request) { return undefined; };
        this.responseValidator = responseValidator || nullFunction;
        return this;
    };
    /** @return {ApiCallbackFunction} The response validator. */
    ApiSettings.prototype.getResponseValidator = function () {
        return this.responseValidator;
    };
    return ApiSettings;
}());
exports.ApiSettings = ApiSettings;
