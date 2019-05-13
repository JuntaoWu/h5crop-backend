import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as passport from 'passport';
import * as http from 'http';
import * as https from 'https';
import * as validate from 'express-validation';
import paramValidation from '../config/param-validation';

const router = express.Router();

import wxuserRouter from './wxuser';

router.use('/wxuser', wxuserRouter);

export default router;
