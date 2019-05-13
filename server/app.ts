import * as createError from 'http-errors';
import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as cors from 'cors';

import indexRouter from './routes';
import passport from './config/passport';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, '../../views'));
app.set('view engine', 'pug');

// parse body params and attache them to req.body
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cookieParser());

app.use(cors());

app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));

app.use((passport).initialize());
app.use((passport).session());

app.use('/api', indexRouter);
app.use('/static', express.static(path.join(__dirname, '../../static')), cors());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {

  console.error(err);
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
