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
  excelData?: any[];
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
    this.loadPage();
    this.pollingSubscription = interval(5000)
      .pipe(switchMap(() => this.fetchFileUploads()))
      .subscribe((response: FileUploadResponse) => {
        this.fileReports = response.data || [];
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadPage(): void {
    this.fetchFileUploads().subscribe((response: FileUploadResponse) => {
      this.fileReports = response.data || [];
    });
  }

  fetchFileUploads(): Observable<FileUploadResponse> {
    const token = sessionStorage.getItem('access_token');
    if (!token) return new Observable<FileUploadResponse>();
    const userId = JSON.parse(atob(token.split('.')[1]));
    return this.http
      .get<FileUploadResponse>(
        `${environment.Url}/api/v1/imports/getData/${userId.user_id}`
      )
      .pipe(
        map((response: any) => ({
          message: response.message,
          data: response.data.map((file: any) => {
            if (file.error_file_url) {
              this.fetchExcelFile(file.error_file_url).subscribe((data) => {
                file.excelData = data;
                this.cdr.detectChanges();
              });
            }
            return {
              fileName: file.file_name,
              successRecords: file.success_records,
              failedRecords: file.failed_records,
              status: file.status,
              errorFileUrl: file.error_file_url || null,
              excelData: [],
            };
          }),
        }))
      );
  }

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
          const sheet = wb.Sheets[wb.SheetNames[0]];
          excelData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
          });
        };
        reader.readAsBinaryString(blob);
        return excelData;
      })
    );
  }
}
