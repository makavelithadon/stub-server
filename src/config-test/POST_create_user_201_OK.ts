import express from 'express';

export default function stub(req: express.Request, res: express.Response) {
  if (typeof req.body === 'undefined') {
    throw new TypeError(
      '<req.body> is missing. Ensure express bodyParser middlewares (json, urlencoded) were called.'
    );
  }
  res.status(201).send();
}
