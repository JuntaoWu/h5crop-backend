import config from "../config/config";
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";
import APIError from "../helpers/APIError";
import WxUserModel, { WxUser } from '../models/wxuser.model';
import CounterModel from '../models/counter.model';

import * as fs from 'fs';
import * as path from 'path';

export let authorize = (req, res, next) => {
    const scope = 'snsapi_base';
    return res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.wx.appId}&redirect_uri=${config.wx.redirectUrl}&response_type=code&scope=${scope}&state=${encodeURIComponent(req.query.state)}#wechat_redirect`);
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

        user = new WxUserModel({
            openId: req.query.wxOpenId,
        });
        await user.save();
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

export let upload = async (req, res, next) => {
    let user = await WxUserModel.findOne({
        openId: req.query.wxOpenId
    });

    if (!user) {
        return res.json({
            code: 404,
            message: "user not found"
        });
    }

    user.name = req.body.name;
    user.screenShotImg = await writeImage(req.body.screenShotImg, req.query.wxOpenId);

    await user.save();

    return res.json({
        code: 0,
        data: user
    });
};

function writeImage(dataUri: string, openId: string): Promise<string> {
    if (!dataUri) {
        return;
    }

    const base64String = dataUri.match(/data:(.*);base64,(.*)/)[2];

    const avatar = Buffer.from(base64String, "base64");
    // const fileName = `/static/screenshots/${openId}-${+new Date()}.jpg`;
    const fileName = `/static/screenshots/${openId}-${+new Date()}.jpg`;

    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(__dirname, `../../..${fileName}`), avatar, (err) => {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(fileName);
            }
        });
    });
}

export let list = async (req, res, next) => {
    const { skip = 0, limit = 100 } = req.query;
    const data = await WxUserModel.find().skip(+skip).limit(+limit);
    return res.json({
        code: 0,
        data: data.map(item => {
            const indexes = item.indexes || [];
            return {
                userId: item.userId,
                number1: indexes[0] || "",
                number2: indexes[1] || "",
                number3: indexes[2] || "",
                name: item.name,
                screenShotImg: item.screenShotImg
            };
        })
    });
};

export default { authorize, login, increase, upload, list };