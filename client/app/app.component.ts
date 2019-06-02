import { Component, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { MatTableDataSource, MatPaginator, PageEvent, MatInput } from '@angular/material';
import { AppService } from './app.service';
import { FormControl } from '@angular/forms';
import { fromEvent, Subject, Observable } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged, switchMap, switchMapTo } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public title = 'h5crop-admin';

  public displayedColumns: string[] = ['userId', 'name', 'createdAt', 'updatedAt', 'number1', 'number2', 'number3',
    'avatarUrl', 'screenShotImg', 'operation'];
  public dataSource = [];

  public pageIndex = 0;
  public pageSize = 100;
  public pageSizeOptions = [25, 50, 100];

  public dateStart: FormControl;
  public dateEnd: FormControl;
  public userName = '';

  public userNameSubject = new Subject<string>();

  public total = 0;

  public standaloneOptions = {
    standalone: true
  };

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private service: AppService) {
    this.dateStart = new FormControl("");
    this.dateEnd = new FormControl(new Date());
  }

  ngAfterViewInit() {
    const _this = this;
    const typeahead = this.userNameSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => {
        // if (this.userName && this.dataSource && this.dataSource.length) {
        //   const items = this.dataSource.filter(item => item.name && item.name.startsWith(this.userName)
        //   );
        //   return Observable.of({
        //     items,
        //     total: items.length,
        //   });
        // }
        return this.service.list((this.pageIndex) * this.pageSize, this.pageSize, this.dateStart.value, this.dateEnd.value, this.userName);
      })
    );

    typeahead.subscribe(data => {
      // Handle the data from the API
      this.dataSource = data.items;
      this.total = data.total;
    });
  }

  async ngOnInit() {


    this.getPage();

    // this.dataSource = new MatTableDataSource();
    // this.dataSource.paginator = this.paginator;
  }

  getPage() {
    this.service.list((this.pageIndex) * this.pageSize, this.pageSize, this.dateStart.value, this.dateEnd.value).subscribe(data => {
      this.dataSource = data.items;
      this.total = data.total;
    });
  }

  refreshPage($event: PageEvent) {
    this.pageIndex = $event.pageIndex;
    this.pageSize = $event.pageSize;

    this.getPage();
  }

  exportAll() {
    location.href = '/api/wxuser/exportAll';
  }

  search() {
    this.getPage();
  }

  reset() {
    this.dateStart.reset();
    this.dateEnd.reset();
  }

  selectFile(event: Event, user) {
    console.log('select file triggered.', event, user);
    var input = event.target as HTMLInputElement;

    var reader = new FileReader();
    reader.onload = () => {
      const dataURL = reader.result;
      this.service.upload(user, dataURL).subscribe((data) => {
        user.avatarUrl = data.avatarUrl;
        user.screenShotImg = data.screenShotImg;
      }, err => {
        alert('Upload File failed.');
      });
    };
    reader.readAsDataURL(input.files[0]);
  }

  takeScreenshot(user) {
    this.service.takeScreenshot(user).subscribe(data => {
      user.screenShotImg = data;
    });
  }

  filter(userName) {
    console.log(userName);
    this.userNameSubject.next(userName);
  }
}
