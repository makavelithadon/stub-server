import express from 'express';
import { createProxyServer } from 'http-proxy';
import type * as http from 'http';
import * as querystring from 'querystring';

const isUrl = (n: any) => typeof n === 'string' && n.startsWith('http');

/**
 * Fix proxied body if bodyParser is involved.
 */
export function fixRequestBody(proxyReq: http.ClientRequest, req: http.IncomingMessage): void {
  const requestBody = (req as express.Request).body;

  if (!requestBody || !Object.keys(requestBody).length) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type') as string;
  const writeBody = (bodyData: string) => {
    // deepcode ignore ContentLengthInCode: bodyParser fix
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  };

  if (contentType && contentType.includes('application/json')) {
    writeBody(JSON.stringify(requestBody));
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    writeBody(querystring.stringify(requestBody));
  }
}

// @ts-ignore
function onProxyRes(proxyRes, _req, res) {
  // @ts-ignore
  var body = [];
  // @ts-ignore
  proxyRes.on('data', function (chunk) {
    body.push(chunk);
  });
  proxyRes.on('end', function () {
    // @ts-ignore
    body = Buffer.concat(body).toString();
    res.end();
  });
}

// Exported for testing purposes only, see [Jest mock inner function](https://stackoverflow.com/q/51269431)

export const send = (
  stubName: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // [request](https://github.com/request/request) can also be used:
  //
  // req.pipe(request(`${target}${req.url}`, next)).pipe(res);
  //
  // As of 2020/01/24
  // - http-proxy: 10861 stars, 7.8 kB min.gz, last release: 2019/09/18
  // - request: 23980 stars, 179.8 kB min.gz, last release: 2018/08/10, [deprecated](https://github.com/request/request/issues/3142)
  //
  // [Proxy with express.js](https://stackoverflow.com/q/10435407)

  const defaultOptions = { changeOrigin: true };
  const proxyOptions = {};
  const sendOptions = {};
  // @ts-ignore
  sendOptions.target = isUrl(stubName) ? stubName : stubName.proxyOptions.target;
  // @ts-ignore
  proxyOptions.target = isUrl(stubName) ? stubName : stubName.proxyOptions.target;

  const proxy = createProxyServer({ ...defaultOptions, ...proxyOptions });

  proxy.on('proxyReq', (...args) => {
    if (stubName.proxyOptions && stubName.proxyOptions.onProxyReq) {
      stubName.proxyOptions.onProxyReq(...args);
    }
    // @ts-ignore
    fixRequestBody(...args);
  });

  proxy.on('proxyRes', (...args) => {
    if (stubName.proxyOptions && stubName.proxyOptions.onProxyRes) {
      stubName.proxyOptions.onProxyRes(...args);
    }
    // @ts-ignore
    onProxyRes(...args);
  });
  // @ts-ignore
  proxy.web(req, res, sendOptions, next);
};
