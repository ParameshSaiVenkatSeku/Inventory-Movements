import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AwsService {
  constructor(private http: HttpClient) {}
  getPresignedUrl(
    fileName: string,
    fileType: string,
    userId: string
  ): Observable<{ presignedUrl: string; fileName: string; userId: string }> {
    return this.http.post<{
      presignedUrl: string;
      fileName: string;
      userId: string;
    }>(`${environment.Url}/api/get-presigned-url`, {
      fileName,
      fileType,
      userId,
    });
  }

  uploadFileToS3(presignedUrl: string, file: File): Observable<any> {
    const headers = { 'Content-Type': file.type };
    return this.http.put(presignedUrl, file, { headers });
  }

  updateProfilePic(
    userId: string,
    fileName: string,
    presignedUrl: string
  ): Observable<any> {
    return this.http.post(`${environment.Url}/api/update-profile-pic`, {
      userId,
      fileName,
      presignedUrl,
    });
  }

  getFiles(UserId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.Url}/api/getfiles/${UserId}`);
  }

  downloadSelectedFiles(selectedFiles: string[]): Observable<Blob> {
    return this.http.post(
      `${environment.Url}api/download-zip`,
      { selectedFiles },
      {
        responseType: 'blob',
      }
    );
  }
}
