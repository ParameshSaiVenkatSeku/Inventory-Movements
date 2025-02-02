import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';

export interface FileUpload {
  fileName: string;
  successRecords: number;
  failedRecords: number;
  status: string;
  errorFileUrl?: string;
  excelData?: any[]; // Add excelData to store the parsed Excel content
}

export interface FileUploadResponse {
  message: string;
  data: FileUpload[];
}

@Component({
  selector: 'app-import-file',
  templateUrl: './import-file.component.html',
  styleUrls: ['./import-file.component.css'],
})
export class ImportFileComponent implements OnInit, OnDestroy {
  fileReports: FileUpload[] = [];
  pollingSubscription!: Subscription;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchFileUploads().subscribe((response: FileUploadResponse) => {
      console.log('Initial Data:', response);
      this.fileReports = response.data || [];
    });

    this.pollingSubscription = interval(5000)
      .pipe(switchMap(() => this.fetchFileUploads()))
      .subscribe((response: FileUploadResponse) => {
        console.log('Polling Data:', response);
        this.fileReports = response.data || [];
      });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Fetch the file upload info from backend
  fetchFileUploads(): Observable<FileUploadResponse> {
    const token = sessionStorage.getItem('access_token');
    let userId;

    if (token) {
      userId = JSON.parse(atob(token.split('.')[1]));
    } else {
      console.error('No access token found');
      return new Observable<FileUploadResponse>(); // Prevent errors
    }

    return this.http
      .get<FileUploadResponse>(
        `${environment.Url}/imports/getData/${userId.user_id}`
      )
      .pipe(
        map((response: any) => ({
          message: response.message,
          data: response.data.map((file: any) => {
            let excelData: any[] = [];

            // If there is an errorFileUrl, fetch the file and parse it
            if (file.error_file_url) {
              this.fetchExcelFile(file.error_file_url).subscribe((data) => {
                file.excelData = data;
                this.cdr.detectChanges(); // Trigger change detection after updating excelData
              });
            }

            return {
              fileName: file.file_name,
              successRecords: file.success_records,
              failedRecords: file.failed_records,
              status: file.status, // Directly use the status
              errorFileUrl: file.error_file_url || null,
              excelData: excelData, // Store the Excel data here
            };
          }),
        }))
      );
  }

  // Fetch and parse the Excel file from the provided URL (S3)
  fetchExcelFile(fileUrl: string): Observable<any[]> {
    return this.http.get(fileUrl, { responseType: 'arraybuffer' }).pipe(
      map((data: ArrayBuffer) => {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const reader = new FileReader();
        let excelData: any[] = [];

        reader.onload = (e: any) => {
          const binaryData = e.target.result;
          const wb = XLSX.read(binaryData, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]]; // Read the first sheet
          excelData = XLSX.utils.sheet_to_json(sheet, {
            header: 1, // Extract data with the first row as header
            defval: '', // Handle undefined cells
          });
        };
        reader.readAsBinaryString(blob);

        return excelData; // Return the parsed Excel data
      })
    );
  }
}
