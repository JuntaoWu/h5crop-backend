import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, PageEvent } from '@angular/material';
import { AppService } from './app.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'h5cropadmin';

  displayedColumns: string[] = ['userId', 'name', 'createdAt', 'updatedAt', 'number1', 'number2', 'number3', 'avatarUrl', 'screenShotImg', 'operation'];
  dataSource = new MatTableDataSource();

  pageIndex = 0;
  pageSize = 100;
  pageSizeOptions = [25, 50, 100];

  public dateStart: FormControl;
  public dateEnd: FormControl;

  total = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private service: AppService) {
    this.dateStart = new FormControl("");
    this.dateEnd = new FormControl(new Date());
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
}
