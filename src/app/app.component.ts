import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {SelectionModel} from '@angular/cdk/collections';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import * as faker from 'faker';
import {MatDialog} from '@angular/material/dialog';
import {DialogOverviewExampleDialogComponent} from './dialog-overview-example-dialog/dialog-overview-example-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface Patient {
  name: string;
  photo: string;
  dob: Date;
  nhsNumber: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent implements OnInit{
  displayedColumns: string[] = ['select', 'photo', 'name', 'dob', 'nhsNumber'];
  dataSource: MatTableDataSource<Patient>;
  selection = new SelectionModel<Patient>(true, []);
  canAddPatient = true;
  duration = 3000;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    const patients = Array.from({length: 100}, () => this.createNewPatient());

    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(patients);
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  createNewPatient(): Patient {
    const context = faker.helpers.contextualCard();
    const transaction = faker.helpers.createTransaction();
    return {
      name: context.name,
      photo: context.avatar,
      dob: context.dob,
      nhsNumber: +transaction.account
    };
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.displayedColumns, event.previousIndex, event.currentIndex);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(index?: number, row?: Patient): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${index + 1}`;
  }

  removeSelection() {
    this.dataSource.data = this.dataSource.data.filter((data) =>
      !this.selection.selected.some((select) => select.nhsNumber === data.nhsNumber));
    this.dataSource._updateChangeSubscription();
    this.selection.clear();
    this.dataSource._updatePaginator(this.dataSource.data.length);
  }

  addSelection() {
    this.canAddPatient = false;
    this.dataSource.data.push(this.createNewPatient());
    this.dataSource._updateChangeSubscription();
    this.dataSource._updatePaginator(this.dataSource.data.length);
    this.snackBar.open('New Patient Added', 'Close', {
      duration: this.duration
    }).afterDismissed().subscribe(() => {
      this.canAddPatient = true;
    });
    // Had to do this because the snackbar dismissal subscription seems to be outside of the life cycle
    setTimeout(() => {
      this.canAddPatient = true;
    }, this.duration);
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialogComponent, {
      width: '250px',
      data: {patients: this.selection.selected}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeSelection();
        this.snackBar.open('Patients Deleted', 'Close', {
          duration: this.duration
        });
      }
    });
  }
}
