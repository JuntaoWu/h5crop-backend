import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MatTableModule, MatPaginatorModule, MatButtonModule, MatToolbarModule, MatDatepickerModule, MatNativeDateModule,
  MatFormFieldModule,
  MatInputModule,
  MatDividerModule,
  MatIconModule
} from '@angular/material';
import { Md2DatepickerModule, MdNativeDateModule } from 'md2';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { AppService } from './app.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    Md2DatepickerModule,
    MdNativeDateModule,
  ],
  providers: [
    AppService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
