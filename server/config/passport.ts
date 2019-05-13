import * as passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';

import config from './config';
import WxUserModel, { WxUser } from '../models/wxuser.model';

import * as https from 'https';
import { compareSync } from 'bcrypt-nodejs';

const localWxOptions = {
    usernameField: 'code',
    passwordField: 'code',
};
const localWxLogin = new LocalStrategy(localWxOptions, async (username, password, done) => {

    if (!username) {
        return done(null, false, {
            message: "Your login details could not be verified. Please try again."
        });
    }

    let accessToken = await getAccessTokenAsync(username).catch(error => {
        console.error(error);
        return null;
    });
    if (!accessToken) {
        //todo: accessToken null.
        return done(null, false);
    }

    const { openid, access_token, refresh_token } = accessToken;

    if (!openid) {
        return done(null, false);
    }

    let user = await getWxUserInfoAsync(access_token, openid).catch(error => {
        console.error(error);
        return null;
    });

    if (user && user.wxOpenId) {
        return done(null, user);
    }

    return done(null, false);
});

async function getAccessTokenAsync(code: string): Promise<any> {
    // Step1: Get access_token & openId.
    const accessTokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.wx.appId}&secret=${config.wx.appSecret}&code=${code}&grant_type=authorization_code`;
    console.log(accessTokenUrl);

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "api.weixin.qq.com",
            port: 443,
            path: `/sns/oauth2/access_token?appid=${config.wx.appId}&secret=${config.wx.appSecret}&code=${code}&grant_type=authorization_code`,
            method: "GET",
        }, (wxRes) => {
            console.log("access_token response from wx api.");
            let data = "";
            wxRes.on("data", (chunk) => {
                data += chunk;
            });
            wxRes.on("end", async () => {
                try {
                    let result = JSON.parse(data);

                    const { openid } = result;

                    if (!openid) {
                        return reject(result);
                    }
                    else {
                        return resolve(result);
                    }
                } catch (ex) {
                    return reject(ex);
                }
            });
        });

        request.end();
    });
}

async function getWxUserInfoAsync(accessToken, openId) {
    // todo: Step2. Get user info
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
    console.log(userInfoUrl);
    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: "api.weixin.qq.com",
            port: 443,
            path: `/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`,
            method: "GET",
        }, (wxRes) => {
            console.log("userinfo response from wx api.");

            let data = "";
            wxRes.on("data", (chunk) => {
                data += chunk;
            });

            wxRes.on("end", () => {
                console.log(data);
                let result = JSON.parse(data);

                let { openid, unionid, nickname, sex, province, city, country, headimgurl } = result;
                if (!openid) {
                    return reject(result);
                }
                else {
                    let user = {
                        openId: openid,
                        unionId: unionid,
                        nickName: nickname,
                        gender: sex,
                        province: province,
                        city: city,
                        country: country,
                        avatarUrl: headimgurl,
                    };

                    return resolve(user);
                }
            });
        });
        request.end();
    });
}

// Setting JWT strategy options
const jwtOptions = {
    // Telling Passport to check authorization headers for JWT
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
    // Telling Passport where to find the secret
    secretOrKey: config.jwtSecret
    // TO-DO: Add issuer and audience checks
};

const jwtWxLogin = new JwtStrategy(jwtOptions, (payload, done) => {
    console.log('jwt payload', payload);

    if (!payload.userId) {
        return done(null, false);
    }

    WxUserModel.findOne({ userId: payload.userId }).then(async user => {
        if (!user) {
            user = new WxUserModel({
                registeredAt: new Date(),
                migrated: true,
                anonymous: true,
            });
            await user.save();
            done(null, user);
        }
        else {
            done(null, user);
        }

    }).catch(error => {
        done(null, false);
    });
});

// Setting JWT strategy options
const jwtServiceOptions = {
    // Telling Passport to check authorization headers for JWT
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
    // Telling Passport where to find the secret
    secretOrKey: config.service.jwtSecret
    // TO-DO: Add issuer and audience checks
};

const jwtServiceLogin = new JwtStrategy(jwtServiceOptions, (payload, done) => {
    console.log('jwt service payload ', payload);
    if (!payload.service || payload.peerName != config.service.name) {
        return done(null, false);
    }

    return done(null, {
        service: payload.service,
    });
});

// Setting Local Admin login options
const localAdminOptions = {
    usernameField: 'email',
    passwordField: 'password',
};

// Setting JWT strategy options
const jwtAdminOptions = {
    // Telling Passport to check authorization headers for JWT
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        ExtractJwt.fromBodyField('token')
    ]),
    // Telling Passport where to find the secret
    secretOrKey: config.admin.jwtSecret
    // TO-DO: Add issuer and audience checks
};

const jwtAdminLogin = new JwtStrategy(jwtAdminOptions, (payload, done) => {
    console.log('jwt admin payload ', payload);
    if (!payload.email) {
        return done(null, false);
    }

    return done(null, payload);
});

(passport).serializeUser(function (user, done) {
    done(null, user);
});

(passport).deserializeUser(function (user, done) {
    done(null, user);
});

(passport).use('jwtWx', jwtWxLogin);
(passport).use('localWx', localWxLogin);
(passport).use('jwtService', jwtServiceLogin);  // for internal api use only, protected by pre-shared service jwt secret.
(passport).use('jwtAdmin', jwtAdminLogin);

export default passport;
