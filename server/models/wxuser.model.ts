
import { prop, Typegoose, ModelType, InstanceType, pre } from "typegoose";
import CounterModel from './counter.model';
/**
 * WxUser Schema
 */
@pre<WxUser>('save', function (next) { // or @pre(this: WxUser, 'save', ...

    if (!this.isNew) {
        return next();
    }

    CounterModel.findOneAndUpdate(
        { seqName: "WxUser" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
        (error, counter) => {
            if (error) {
                return next(error);
            }
            this.userId = (+counter.seq);
            next();
        });
})
export class WxUser extends Typegoose {
    @prop({ index: true })
    userId: Number;
    @prop()
    openId: String;
    @prop()
    name: String;
    @prop()
    screenShotImg: String;
    @prop()
    unionId: String;
    @prop()
    session_key: String;
    @prop()
    avatarUrl?: String;
    @prop()
    city?: String;
    @prop()
    country?: String;
    @prop()
    gender?: Number;
    @prop()
    language?: String;
    @prop()
    nickName?: String;
    @prop()
    province?: String;
    @prop()
    registeredAt?: Date;
    @prop()
    indexes?: Array<number>;

    constructor() {
        super();
    }
}

const WxUserModel = new WxUser().getModelForClass(WxUser, {
    schemaOptions: {
        timestamps: true,
    }
});

export default WxUserModel;