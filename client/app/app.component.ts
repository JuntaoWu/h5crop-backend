import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatPaginator, PageEvent } from '@angular/material';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'h5cropadmin';

  displayedColumns: string[] = ['userId', 'name', 'number1', 'number2', 'number3', 'screenShotImg'];
  dataSource = new MatTableDataSource();

  pageIndex = 0;
  pageSize = 100;
  pageSizeOptions = [25, 50, 100];

  total = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private service: AppService) {

  }

  async ngOnInit() {

    this.getPage();

    // this.dataSource = new MatTableDataSource();
    // this.dataSource.paginator = this.paginator;
  }

  getPage() {
    this.service.list((this.pageIndex) * this.pageSize, this.pageSize).subscribe(data => {
      this.dataSource = data.items;
      this.total = data.total;
    });
  }

  refreshPage($event: PageEvent) {
    this.pageIndex = $event.pageIndex;
    this.pageSize = $event.pageSize;

    this.getPage();
  }
}
