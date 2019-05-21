import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import validate from 'express-validation';
import * as passport from 'passport';
import config from '../config/config';
import * as https from 'https';
import wxuserCtrl from '../controllers/wxuser.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/authorize')
    .get(wxuserCtrl.authorize);

router.route('/login')
    .get(passport.authenticate("localWx", { failWithError: true }), wxuserCtrl.login);

router.route('/increase')
    .post(wxuserCtrl.increase);

router.route('/upload')
    .post(wxuserCtrl.upload);

router.route('/list')
    .get(wxuserCtrl.list);

router.route('/exportAll')
    .get(wxuserCtrl.exportAll);

export default router;
