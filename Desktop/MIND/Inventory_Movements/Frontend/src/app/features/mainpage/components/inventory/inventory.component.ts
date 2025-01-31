import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as xlsx from 'xlsx';
import { jsPDF } from 'jspdf';
import { MainpageService } from '../../services/mainpage.service';
import { debounceTime, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface cartData {
  category_name: string;
  created_at: string;
  product_id: number;
  product_name: string;
  quantity: number;
  vendor: string;
  vendor_name: string;
  user_id: number;
  checked: boolean;
  quantity_in_stock: number;
}

@Component({
  selector: 'app-inventory',
  standalone: false,
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
})
export class InventoryComponent implements OnInit {
  onImport() {
    throw new Error('Method not implemented.');
  }
  validColumns = [
    'product_name',
    'product_image',
    'status',
    'quantity_in_stock',
    'unit_price',
    'category_name',
    'vendor_name',
  ];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  subject = new Subject<any>();
  filter: boolean = true;
  // uploading: boolean = false;
  progressValue: number = 0;
  uploadInProgress: boolean = false;

  handleFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error('File input element not found!');
    }
  }

  resetFileSelection(): void {
    this.selectedFile = null;
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.toastr.error('Please select a file to upload.', 'Error');
      return;
    }

    this.uploadInProgress = true;
    this.progressValue = 0;

    try {
      const fileName = this.selectedFile.name;
      const fileType = this.selectedFile.type;
      let userId: number;
      const token = sessionStorage.getItem('access_token');
      if (token) {
        const user = JSON.parse(atob(token.split('.')[1]));
        userId = user.user_id;
      } else {
        console.error('No access token found');
        return;
      }
      console.log(userId);
      const presignedUrlResponse = await this.http
        .post<any>(`${environment.Url}/api/get-presigned-url`, {
          fileName,
          fileType,
          userId,
        })
        .toPromise();

      if (!presignedUrlResponse || !presignedUrlResponse.presignedUrl) {
        throw new Error('Failed to get presigned URL');
      }

      const presignedUrl = presignedUrlResponse.presignedUrl;
      console.log(presignedUrl);

      await this.http
        .put(presignedUrl, this.selectedFile, {
          reportProgress: true,
          observe: 'events',
        })
        .toPromise();

      this.toastr.success('File uploaded successfully!', 'Success');
    } catch (error) {
      console.error('Error uploading file:', error);
      this.toastr.error('File upload failed!', 'Error');
    } finally {
      this.uploadInProgress = false;
      this.selectedFile = null;
    }
  }

  uploadExcelData(excelData: any[]) {
    if (excelData.length > 0) {
      this.http
        .post(`${environment.Url}/dashboard/import-data`, {
          csvData: excelData,
        })
        .subscribe(
          (response) => {
            // console.log('Data successfully uploaded to the backend:', response);
            this.toastr.success('Data successfully uploaded', 'Success');
          },
          (error) => {
            // console.error('Error uploading Excel data to the backend:', error);
            this.toastr.error('Error uploading excel data', 'Error');
          }
        );
    }
  }

  validateColumns(columns: string[]): boolean {
    const normalizedColumns = columns.map((col) => col.trim());
    // console.log(normalizedColumns);
    return this.validColumns.every((column) =>
      normalizedColumns.includes(column)
    );
  }

  mapRowToProduct(row: string[], columns: string[]) {
    const product: any = {};
    columns.forEach((col, index) => {
      product[col] = row[index];
    });
    return product;
  }

  removeFromCart(item: any) {
    // console.log(item);
    this.http
      .delete(`${environment.Url}/dashboard/deleteItem/${item.product_id}`, {
        body: { vendorName: item.vendor_name }, // Add vendor name in the body
      })
      .subscribe({
        next: (response) => {
          // console.log('Item deleted:', response);
          this.toastr.success('Item deleted successfully', 'Success');
          this.fetchData();
          this.getCartData();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
        },
      });
  }

  toggleCartItem(_t124: any) {
    throw new Error('Method not implemented.');
  }

  closeDeleteModal() {
    throw new Error('Method not implemented.');
  }

  filterData: any = {
    product_name: '',
    category_name: '',
    status: '',
  };

  productData: any;
  pageNo = 1;
  limit = 5;
  selectedItems: any[] = [];
  totalPage = 1;
  totalcount = 0;
  categories: any;
  showCart = false;
  searchTerm: string = '';
  valid: boolean = false;
  products: any;
  selectedFile: File | null = null;
  productToDelete: number | null = null;

  files = [
    { name: 'Tech requirements.pdf', size: '200 KB' },
    { name: 'Dashboard screenshot.jpg', size: '720 KB' },
    { name: 'Dashboard prototype recording.mp4', size: '16 MB' },
  ];

  cartData: cartData[] = [];
  cartItems: any;
  constructor(
    private http: HttpClient,
    private main: MainpageService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subject.pipe(debounceTime(300)).subscribe((data) => {
      // console.log(data);
    });

    this.getCartData();
    this.http
      .get(`${environment.Url}/dashboard/categories`)
      .subscribe((data) => {
        this.categories = data;
      });

    this.main.getqueryParam().subscribe((params) => {
      this.filterData.category_name = params['category_name'] || '';
      this.filterData.product_name = params['product_name'] || '';
      this.filterData.status = params['status'] || '';
      this.pageNo = +params['page'] || 1;
      this.updateQuery();
      this.fetchData();
    });
  }

  getCartData(): void {
    this.http.get(`${environment.Url}/dashboard/cartData`).subscribe(
      (response: any) => {
        this.cartItems = response.data;
      },
      (error) => {
        console.error('Error fetching cart data:', error);
      }
    );
  }

  onCart() {
    this.showCart = true;
    this.filter = false;
  }

  onView() {
    this.showCart = false;
    this.filter = true;
  }

  move() {
    this.main.sendSelectedItems(this.selectedItems);
    this.selectedItems = [];
  }

  cartchange(item: any, event: any): void {
    item.checked = event.target.checked;
    if (item.checked) {
      if (!this.selectedItems.includes(item)) {
        this.selectedItems.push(item);
      }
    } else {
      const index = this.selectedItems.indexOf(item);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      }
    }
  }

  fetchData() {
    const store = Object.keys(this.selectedFilters).filter(
      (key) => this.selectedFilters[key]
    );

    // console.log(store);
    this.main
      .filterProduct(
        this.filterData,
        this.limit,
        this.pageNo,
        this.searchText,
        store
      )
      .subscribe({
        next: (res: any) => {
          // console.log(res);
          this.productData = res.data;
          this.totalPage = res.pagination.totalPage;
          this.totalcount = res.pagination.totalCount;
        },
        error: (error) => console.log(error, 'filter error'),
      });
  }

  updateQuery() {
    const params = {
      category_name: this.filterData.category_name,
      status: this.filterData.status,
      product_name: this.filterData.product_name,
      page: this.pageNo,
    };
    this.main.updateQueryparam(params);
  }

  showModal = false;

  openDeleteModal(productId: number) {
    this.productToDelete = productId;
  }

  confirmDelete() {
    if (this.productToDelete !== null) {
      this.http
        .delete(`${environment.Url}/dashboard/product/${this.productToDelete}`)
        .subscribe(
          (response) => {
            // console.log('Product soft deleted successfully');
            this.productToDelete = null;
            this.fetchData();
          },
          (error) => {
            console.error('Error soft deleting product:', error);
          }
        );
    }
  }

  handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        this.uploadData(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  }

  uploadData(data: any): void {
    this.http
      .post(`${environment.Url}/dashboard/upload/excel`, { data })
      .subscribe(
        (response) => {
          // console.log('Data uploaded successfully:', response);
        },
        (error) => {
          console.error('Error uploading data:', error);
        }
      );
  }

  downloadPDF(product: any) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Product Details', 20, 20);
    doc.setFontSize(12);
    // console.log(product);
    doc.text(`Product Name: ${product.product_name}`, 20, 30);
    // console.log(product.product_name);
    doc.text(`Category: ${product.category_name}`, 20, 40);
    // console.log(product.category_name);
    doc.text(
      `Status: ${product.status === '1' ? 'Available' : 'Sold Out'}`,
      20,
      50
    );
    doc.text(`Quantity: ${product.quantity_in_stock}`, 20, 60);
    // console.log(product.quantity_in_stock);
    doc.text(`Unit: ${product.unit_price}`, 20, 70);
    // console.log(product.unit_price);
    doc.text(`Vendors: ${product.vendor_name}`, 20, 80);
    // console.log(product.vendor_name);
    doc.text(`Image Url: ${product.product_image}`, 20, 90);
    // console.log(product.product_image);
    doc.save(`${product.product_name}_details.pdf`);
  }

  showMoveToCartModal: boolean = false;

  handleform(productData: any) {
    this.http
      .post(`${environment.Url}/dashboard/product`, productData)
      .subscribe(
        (data) => {
          // console.log('New product added:', data);
        },
        (error) => {
          // console.error('Error adding product:', error);
        }
      );
    if (productData.status === 'Available') productData.status = 1;
    else productData.status = 0;
  }

  download() {
    if (this.productData) {
      const filteredData = this.productData.some((item: any) => item.checked)
        ? this.productData.filter((item: any) => item.checked === true)
        : this.productData;

      const dataWithoutProductIdAndChecked = filteredData.map((item: any) => {
        const { product_id, checked, ...rest } = item; // Destructure and omit these properties
        return rest;
      });

      const ws = xlsx.utils.json_to_sheet(dataWithoutProductIdAndChecked);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'place');

      xlsx.writeFile(wb, 'dashboard.xlsx');
    }
  }

  onproductedit(item: any) {
    this.main.setdata(item);
  }

  editform(edit: any) {
    this.main.editproduct(edit).subscribe((data) => {
      this.toastr.success('Product updated Successfully', 'Success');
    });
  }

  getPageNumbers(): (number | string)[] {
    const pageNumbers: (number | string)[] = [];
    const currentPage = this.pageNo;
    const totalPages = this.totalPage;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (start > 1) {
      pageNumbers.push(1);
      if (start > 2) pageNumbers.push('...');
    }
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  }

  navigateToPage(page: number | string): void {
    if (page === '...') return;
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    if (parsedPage >= 1 && parsedPage <= this.totalPage) {
      this.pageNo = parsedPage;
      this.updateQuery();
      this.fetchData();
    }
  }

  data: any;

  onUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      this.toastr.error('No File Selected', 'Error');
      return;
    }
    const fileType = file.name.split('.').pop();
    if (fileType !== 'xlsx' && fileType !== 'xls') {
      this.toastr.error('Invalid File Type', 'Error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = xlsx.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      this.data = xlsx.utils.sheet_to_json(worksheet);
      this.adddata();
    };
    reader.readAsArrayBuffer(file);
  }

  adddata() {
    if (this.data) {
      for (let items of this.data) {
        this.main.addproducts(items);
      }
      this.toastr.success('Data Successfully Updated', 'Success');
    }
  }
  isDropdownOpen = false;
  selectedFilters: { [key: string]: boolean } = {};
  searchText?: string = '';

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onCheckboxChange(filter: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.selectedFilters[filter] = checkbox.checked;
  }

  handleModelChanges() {
    this.fetchData();
  }
}
