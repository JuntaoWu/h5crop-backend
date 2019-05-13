import * as Joi from 'joi';

export default {

    // POST /api/posts
    createPlayer: {
        body: {
            openId: Joi.string().required(),
        }
    },
    // UPDATE /api/users/:userId
    updatePlayer: {
        body: {
            //   username: Joi.string().required(),
            //   mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
        },
        params: {
            openId: Joi.string().required()
        }
    },
    // GET /shared/:unionId
    getShared: {
        params: {
            unionId: Joi.string().required()
        }
    },
    // GET /shared/:unionId
    loadPreference: {
        params: {
            platform: Joi.string().required()
        }
    }
};
