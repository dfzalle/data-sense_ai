import { ThemeService } from './../../../_services/theme/theme.service';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { UtilService } from '../../../_services/utils/util.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NavigationStart, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ApiConstants } from './../../../_helpers/constants/api';
import { HttpService } from '../../../_services/http/http.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, FormsModule, MatSlideToggleModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy, OnInit {
  today: string = moment().format('MM/DD/YYYY HH:mm');
  private subscription: Subscription;
  toggleChecked: boolean = false;
  databases: any[] = [];
  selectedDatabase: string = '';
  isLoadingDatabases: boolean = false;
  @Input()
  isMobile: boolean = false;
  @Output() sidenav: EventEmitter<any> = new EventEmitter();

  constructor(
    private util: UtilService,
    private theme: ThemeService,
    private router: Router,
    private http: HttpService
  ) {
    this.toggleChecked = this.theme.theme == 'light-theme' ? false : true;
    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      // Update timestamp on navigation
      this.today = moment().format('MM/DD/YYYY HH:mm');
    });
  }

  ngOnInit() {
    this.loadDatabases();
  }

  loadDatabases() {
    this.isLoadingDatabases = true;
    this.http.getDatabases().subscribe({
      next: (res: any) => {
        this.databases = res.databases || [];
        this.isLoadingDatabases = false;

        if (this.databases.length > 0 && !this.selectedDatabase) {
          // Try to find DataSense database as default, otherwise use first one
          const dataSenseDb = this.databases.find(
            (db: any) => db.database_name.toLowerCase() === 'datasense'
          );
          this.selectedDatabase = dataSenseDb ? dataSenseDb.database_name : this.databases[0].database_name;
          ApiConstants.SELECTED_DATABASE = this.selectedDatabase;
          // Notify components to load trending questions for the default database
          this.util.notifyDatabaseChange(this.selectedDatabase);
          this.util.notifyDropdownChange();
        }
      },
      error: (err) => {
        console.error('Error loading databases:', err);
        this.isLoadingDatabases = false;
        // Fallback to hardcoded options if API fails
        this.databases = [
          { database_name: 'DataSense' },
          { database_name: 'Call Center DW' }
        ];
        this.selectedDatabase = 'DataSense';
        ApiConstants.SELECTED_DATABASE = this.selectedDatabase;
      }
    });
  }

  themChange() {
    this.toggleChecked = !this.toggleChecked;
    if (this.toggleChecked) {
      this.theme.setTheme('dark-theme');
    } else {
      this.theme.setTheme('light-theme');
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggle() {
    this.sidenav.emit();
  }

  onDatabaseChange(event: Event): void {
    const selectedDb = (event.target as HTMLSelectElement).value;
    this.selectedDatabase = selectedDb;
    ApiConstants.SELECTED_DATABASE = selectedDb;
    this.today = moment().format('MM/DD/YYYY HH:mm');
    console.log('Source changed to:', selectedDb);

    // Notify components that database has changed
    this.util.notifyDatabaseChange(selectedDb);
    this.util.notifyDropdownChange();
  }
}
