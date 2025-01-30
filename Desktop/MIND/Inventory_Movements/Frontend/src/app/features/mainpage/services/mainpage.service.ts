import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AuthserviceService } from '../../auth/services/authservice.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class MainpageService {
  private apiUrl = 'http://localhost:3000';
  dataSource = new Subject<any>();
  sendToCart = new Subject<any[]>();
  data: any;
  constructor(
    private http: HttpClient,
    private authSer: AuthserviceService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  private sendToCartSubject = new BehaviorSubject<any[]>([]);

  sendToCart$ = this.sendToCartSubject.asObservable();

  updateCart(data: any[]): void {
    this.sendToCartSubject.next(data);
  }

  getUserInfo(): Observable<any> {
    const token = this.authSer.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(`${this.apiUrl}/user/userdata`);
  }

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

  getFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.Url}/api/getfiles`);
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

  editproduct(edit: any) {
    // console.log(edit);
    return this.http.post(`${environment.Url}/dashboard/product`, edit);
  }

  setdata(item: any) {
    this.dataSource.next(item);
    this.data = item;
  }

  sendSelectedItems(items: any[]) {
    this.sendToCart.next(items);
  }

  filterProduct(
    filter: any,
    limit: any,
    pageno: any,
    searchText: any,
    store: any
  ) {
    let params = new HttpParams()
      .set('product_name', filter.product_name || '')
      .set('category_name', filter.category_name || '')
      .set('status', filter.status || '')
      .set('limit', limit.toString())
      .set('page', pageno.toString())
      .set('searchText', searchText)
      .set('filters', JSON.stringify(store));
    return this.http.get(`${environment.Url}/dashboard/filterProduct`, {
      params,
    });
  }

  updateQueryparam(params: any) {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  getqueryParam(): Observable<any> {
    return this.activatedRoute.queryParams;
  }

  addproducts(productData: any) {
    return this.http
      .post(`${environment.Url}/dashboard/product`, productData)
      .subscribe(
        (data) => {
          this.toastr.success('Product Added Successfully', 'Success');
          // console.log('New product added:', data);
        },
        (error) => {
          console.error('Error adding product:', error);
        }
      );
  }
}
