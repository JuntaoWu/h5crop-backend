import config from "../config/config";
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import APIError from "../helpers/APIError";
import WxUserModel, { WxUser } from '../models/wxuser.model';
import CounterModel from '../models/counter.model';

export let authorize = (req, res, next) => {
    return res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.wx.appId}&redirect_uri=${config.wx.redirectUrl}&response_type=code&scope=snsapi_userinfo&state=${encodeURIComponent(req.query.state)}#wechat_redirect`);
};

export let login = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        let dbUser = await WxUserModel.findOne({
            openId: req.user.openId,
        });

        console.log("dbUser", dbUser);

        if (!dbUser) {
            console.log("req.user", req.user);
            dbUser = new WxUserModel(req.user);
            await dbUser.save();
        }

        res.cookie('wxOpenId', req.user.openId);
        let redirectUrl = decodeURIComponent(req.query.state);
        console.log('state:', redirectUrl);
        if (/\?/.test(redirectUrl)) {
            redirectUrl += `&wxOpenId=${req.user.openId}`;
        }
        else if (/#/.test(redirectUrl)) {
            redirectUrl = redirectUrl.replace(/(.*)#([^#]*)/, `$1?wxOpenId=${req.user.openId}#$2`);
        }
        else {
            redirectUrl += `?wxOpenId=${req.user.openId}`;
        }
        console.log('redirectTo:', redirectUrl);
        return res.redirect(redirectUrl);
    }

    const error = new APIError("Cannot resolve user info", 401);
    return next(error);
};

export let increase = async (req, res, next) => {
    let user = await WxUserModel.findOne({
        openId: req.query.wxOpenId
    });

    if (!user) {
        return res.json({
            code: 404,
            message: "user not found"
        });
    }

    if (user.indexes && user.indexes.length >= 3) {
        return res.json({
            code: 0,
            data: {
                total: user.indexes[2]
            }
        });
    }
    else {
        user.indexes = user.indexes || [];

        CounterModel.findOneAndUpdate(
            { seqName: "StarIndex" },
            { $inc: { seq: 1 } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
            async (error, counter) => {
                if (error) {
                    return next(error);
                }
                user.indexes = user.indexes.concat(+counter.seq);

                console.log(user.indexes);

                await user.save();

                return res.json({
                    code: 0,
                    data: {
                        total: user.indexes[user.indexes.length - 1]
                    }
                });
            });
    }
};

export default { authorize, login, increase };