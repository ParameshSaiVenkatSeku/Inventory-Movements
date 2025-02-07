import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, Subject, take } from 'rxjs';
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
  ) {
    this.getUserPermissions();
  }

  private sendToCartSubject = new BehaviorSubject<any[]>([]);
  permissions: any[] = [];
  private token = sessionStorage.getItem('access_token');
  decodedToken = this.token ? JSON.parse(atob(this.token.split('.')[1])) : null;
  sendToCart$ = this.sendToCartSubject.asObservable();

  updateCart(data: any[]): void {
    this.sendToCartSubject.next(data);
  }

  getUserInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/user/userdata`);
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
    }>(`${environment.Url}/api/v1/aws/get-presigned-url`, {
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
    return this.http.post(`${environment.Url}/api/v1/aws/update-profile-pic`, {
      userId,
      fileName,
      presignedUrl,
    });
  }

  getFiles(): Observable<any[]> {
    const negation_value = -1;
    return this.http.get<any[]>(
      `${environment.Url}/api/v1/aws/getfiles/${negation_value}`
    );
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
    return this.http.post(`${environment.Url}/api/v1/dashboard/product`, edit);
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
    return this.http.get(
      `${environment.Url}/api/v1/dashboard/filterProduct/${this.decodedToken.user_id}`,
      {
        params,
      }
    );
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
      .post(`${environment.Url}/api/v1/dashboard/product`, productData)
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

  getUserPermissions(): void {
    this.http
      .get<any[]>(
        `${environment.Url}/api/v1/auth/permissions/${this.decodedToken.user_id}`
      )
      .pipe(
        take(1),
        map((data) => data.map((perm) => perm.permission_name))
      )
      .subscribe(
        (permissions) => {
          console.log('User Permissions:', permissions);
          this.permissions = permissions; // ✅ Store in a variable
        },
        (error) => {
          console.error('Error fetching permissions:', error);
          this.permissions = []; // Ensure array is always defined
        }
      );
  }
}
