import config from '../config/config';
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import APIError from '../helpers/APIError';
import WxUserModel, { WxUser } from '../models/wxuser.model';
import CounterModel from '../models/counter.model';
import * as Excel from 'exceljs';

import * as fs from 'fs';
import * as path from 'path';

import * as Nightmare from 'nightmare';

export let authorize = (req, res, next) => {
    const scope = 'snsapi_base';
    return res.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.wx.appId}&redirect_uri=${config.wx.redirectUrl}&response_type=code&scope=${scope}&state=${encodeURIComponent(req.query.state)}#wechat_redirect`);
};

export let login = async (req: Request, res: Response, next: NextFunction) => {

    try {
        let dbUser = await WxUserModel.findOne({
            openId: req.user.openId,
        });

        if (!dbUser) {
            console.log('req.user', req.user);
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
    catch (err) {
        console.error('Login failed,', err);
        return next(err);
    }
};

export let increase = async (req, res, next) => {

    try {
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

            const counter = await CounterModel.findOneAndUpdate(
                { seqName: 'StarIndex' },
                { $inc: { seq: 1 } },
                { upsert: true, new: true, setDefaultsOnInsert: true },
            );

            user.indexes = user.indexes.concat(+counter.seq);

            const savedUser = await user.save({
                validateBeforeSave: true
            });

            if (!savedUser) {
                console.error('Save user failed, user indexes: ', user.indexes);
                const error = new APIError('Save user failed');
                return next(error);
            }

            console.log('Save user success, user indexes: ', savedUser.indexes);

            return res.json({
                code: 0,
                data: {
                    total: savedUser.indexes[savedUser.indexes.length - 1]
                }
            });
        }
    }
    catch (err) {
        console.error('Increase count failed,', err);
        return next(err);
    }
};

export let upload = async (req, res, next) => {

    try {
        const user = await WxUserModel.findOne({
            openId: req.query.wxOpenId
        });

        if (!user) {
            return res.json({
                code: 404,
                message: 'User not found'
            });
        }

        user.name = req.body.name;
        if (req.body.screenShotImg) {
            user.screenShotImg = await writeImageAsync(req.body.screenShotImg, req.query.wxOpenId, 'screenshots');
        }

        if (req.body.avatarImg) {
            user.avatarUrl = await writeImageAsync(req.body.avatarImg, req.query.wxOpenId, 'avatar');
            if (!req.body.screenShotImg) {
                user.screenShotImg = await retakeScreenshot(req.query.wxOpenId, user.avatarUrl.toString()).catch(error => {
                    return next(error);
                });
            }
        }

        if (!user.screenShotImg) {
            console.error('writeImageAsync failed, userId:', user.userId);
            return next('writeImageAsync failed');
        }

        await user.save();

        return res.json({
            code: 0,
            data: user
        });
    }
    catch (err) {
        console.error('Upload image failed,', err);
        return next(err);
    }
};

function writeImageAsync(dataUri: string, openId: string, type: string): Promise<string> {
    if (!dataUri) {
        return Promise.reject('writeImageAsync: image not provided.');
    }

    const base64String = dataUri.match(/data:(.*);base64,(.*)/)[2];

    const avatar = Buffer.from(base64String, 'base64');
    // const fileName = `/static/screenshots/${openId}-${+new Date()}.jpg`;
    const fileName = `/static/${type}/${openId}-${+new Date()}.jpg`;

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
    const { skip = 0, limit = 100, dateStart, dateEnd, filter = '' } = req.query;

    const totalCondition: any = {};
    if (dateStart && new Date(dateStart)) {
        totalCondition.updatedAt = {
            $gte: dateStart
        };
    }

    if (dateEnd && new Date(dateEnd)) {
        totalCondition.updatedAt = totalCondition.updatedAt || {};
        totalCondition.updatedAt.$lte = dateEnd;
    }

    if (filter) {
        totalCondition.name = { $regex: '^' + filter };
    }

    const total = await WxUserModel.count(totalCondition);
    const data = await WxUserModel.find(totalCondition).skip(+skip).limit(+limit);
    const items = data.map(item => {
        const indexes = item.indexes || [];
        return {
            openId: item.openId,
            userId: item.userId,
            number1: indexes[0] || '',
            number2: indexes[1] || '',
            number3: indexes[2] || '',
            name: item.name,
            createdAt: (item as any).createdAt,
            updatedAt: (item as any).updatedAt,
            screenShotImg: item.screenShotImg,
            avatarUrl: item.avatarUrl,
        };
    });
    return res.json({
        code: 0,
        data: {
            items: items,
            total: total
        }
    });
};

export let exportAll = async (req: Request, res: Response, next: NextFunction) => {
    const data = await WxUserModel.find();
    const items = data.map(item => {
        const indexes = item.indexes || [];
        return {
            userId: item.userId,
            number1: indexes[0] || '',
            number2: indexes[1] || '',
            number3: indexes[2] || '',
            name: item.name,
            createdAt: (item as any).createdAt,
            updatedAt: (item as any).updatedAt,
            screenShotImg: item.screenShotImg ? `http://h5crop.cdyjsw.cn${item.screenShotImg}` : ''
        };
    });

    const workbook = createExcel(items);
    res.setHeader('Content-Type', 'application/vnd.ms-excel;');
    res.setHeader('Content-disposition', `attachment;filename=report.xlsx`);
    workbook.xlsx.write(res);
};

function createExcel(items) {
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.columns = [
        { header: 'No.', key: 'userId', width: 10 },
        { header: '姓名', key: 'name', width: 32 },
        { header: '登录时间', key: 'createdAt', width: 32 },
        { header: '上传时间', key: 'updatedAt', width: 32 },
        { header: '编号1', key: 'number1', width: 20, outlineLevel: 1 },
        { header: '编号2', key: 'number2', width: 20, outlineLevel: 1 },
        { header: '编号3', key: 'number3', width: 20, outlineLevel: 1 },
        { header: '海报', key: 'screenShotImg', width: 50, outlineLevel: 1 },
    ];

    sheet.addRows(items);
    return workbook;
}

export let screenshotSSR = async (req, res, next) => {
    const user = await WxUserModel.findOne({
        openId: req.query.wxOpenId
    });
    return res.render('screenshotSSR', {
        name: user.name,
        index: user.indexes.length > 0 && user.indexes[user.indexes.length - 1] || 0,
        avatarUrl: req.query.avatarUrl || user.avatarUrl || ''
    });
};

async function retakeScreenshot(openId: string, avatarUrl?: string): Promise<any> {
    const filename = `/static/screenshots/${openId}-${+new Date()}.jpg`;
    const filepath = path.join(__dirname, `../../..${filename}`);
    console.log(filename);
    const nightmare = new Nightmare({
        webPreferences: {
            useContentSize: true,
        }
    }); // Create the Nightmare instance.
    const url = `http://localhost:8125/api/wxuser/screenshotSSR?wxOpenId=${openId}&avatarUrl=${avatarUrl || ''}`;

    return new Promise((resolve, reject) => {
        return nightmare
            .viewport(640, 1136)
            .goto(url) // Point the browser at the web server we just started.
            .wait(3000) // Wait until the chart appears on screen.
            .screenshot(filepath) // Capture a screenshot to an image file.
            .end() // End the Nightmare session. Any queued operations are completed and the headless browser is terminated.
            .then(() => {
                console.log('we are done.');
                return resolve(filename);
            }, (error) => {
                console.error(error);
                return reject(error);
            }); // return when we are done.
    });
}

export let takeScreenshot = async (req, res, next) => {
    const user = await WxUserModel.findOne({
        openId: req.query.wxOpenId
    });

    if (!user) {
        return res.json({
            code: 404,
            message: 'User not found'
        });
    }

    const filename = await retakeScreenshot(req.query.wxOpenId).catch(error => {
        return next(error);
    });

    if (filename) {
        user.screenShotImg = filename;
        await user.save();
    }

    return res.json({
        code: 0,
        data: filename,
    });
    // const filepath = path.join(__dirname, `../../..${filename}`);
    // return res.sendFile(filepath);
    // spawn Electron
    // const child = proc.spawn(electron as any);

    // child.on('ready', () => {
    //     screenshot(
    //         {
    //             url: `http://localhost:8125/api/wxuser/screenshotSSR?wxOpenId=oA2BE1HqQQb85gdSwtQbgVA6TQao`,
    //             width: 640,
    //             height: 1080
    //         },
    //         (err, image) => {
    //             // image.data is a Node Buffer
    //             // image.size contains width and height
    //             // image.devicePixelRatio will contain window.devicePixelRatio
    //             const stream = new PassThrough();
    //             stream.end(image.data);

    //             return stream.pipe(res);
    //             // image.data.pipe(res);
    //         });
    // });
};

export default { authorize, login, increase, upload, list, exportAll, screenshotSSR, takeScreenshot };
