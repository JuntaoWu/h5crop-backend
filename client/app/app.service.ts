import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { UploadOptions } from './upload-options.enum';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }

  list(skip: number = 0, limit: number = 100, dateStart: Date = null, dateEnd: Date = null, filter: string = null) {
    return this.http.get(`/api/wxuser/list?skip=${skip}&limit=${limit}&dateStart=${dateStart && dateStart.toJSON() || ''}&dateEnd=${dateEnd && dateEnd.toJSON() || ''}&filter=${filter || ''}`).pipe(
      map((res: any) => {
        if (res.code !== 0) {
          return throwError(res && res.message || '获取数据失败');
        }
        return res.data;
      }),
      catchError((error) => {
        console.error(error);
        return of([]);
      })
    );
  }

  upload(user, dataURL, uploadOption: UploadOptions) {
    const data: any = {
      name: user.name
    };

    if (uploadOption === UploadOptions.Avatar) {
      data.avatarImg = dataURL;
    }
    else {
      data.screenShotImg = dataURL;
    }

    return this.http.post(`/api/wxuser/upload?wxOpenId=${user.openId}`, data).pipe(
      map((res: any) => {
        if (res.code !== 0) {
          return throwError(res && res.message || '获取数据失败');
        }
        return res.data;
      }),
      catchError((error) => {
        console.error(error);
        return of();
      })
    );
  }

  takeScreenshot(user) {
    return this.http.get(`/api/wxuser/takeScreenshot?wxOpenId=${user.openId}`).pipe(
      map((res: any) => {
        if (res.code !== 0) {
          return throwError(res && res.message || '获取数据失败');
        }
        return res.data;
      }),
      catchError((error) => {
        console.error(error);
        return of();
      })
    );
  }
}
