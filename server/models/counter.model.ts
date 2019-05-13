
import { prop, Typegoose, ModelType, InstanceType, pre } from "typegoose";

class CounterSchema extends Typegoose {
    @prop({ required: true })
    public seqName: String;

    @prop({ default: 1 })
    public seq: Number;
}

const CounterModel = new CounterSchema().getModelForClass(CounterSchema);

export default CounterModel;