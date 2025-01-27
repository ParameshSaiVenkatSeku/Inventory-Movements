import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as xlsx from 'xlsx';
import { jsPDF } from 'jspdf';
import { MainpageService } from '../../services/mainpage.service';
import { debounce, debounceTime, Subject } from 'rxjs';
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
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error('File input element not found!');
    }
  }

  handleFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: '' }); // Convert to JSON

        if (this.validateColumns(Object.keys(jsonData[0] as object))) {
          this.uploadExcelData(jsonData);
        } else {
          // alert('Invalid Excel format. Please ensure the columns are correct.');
          this.toastr.error('Invalid Excel format', 'Error');
        }
      };
      reader.readAsArrayBuffer(file);
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
            console.log('Data successfully uploaded to the backend:', response);
            // alert('Data successfully uploaded!');
            this.toastr.success('Data successfully uploaded', 'Success');
          },
          (error) => {
            console.error('Error uploading Excel data to the backend:', error);
            // alert('Error uploading Excel data. Please try again.');
            this.toastr.error('Error uploading excel data', 'Error');
          }
        );
    }
  }

  validateColumns(columns: string[]): boolean {
    const normalizedColumns = columns.map((col) => col.trim());
    console.log(normalizedColumns);
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
    console.log(item);
    const url = `http://localhost:3000/dashboard/deleteItem/${item.product_id}`;

    this.http.delete(url).subscribe({
      next: (response) => {
        console.log('Item deleted:', response);
        this.fetchData();
        this.getCartData();
      },
      error: (error) => {
        console.error('Error deleting item:', error);
        // Handle the error (e.g., display an error message)
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
  limit = 10;
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
  // searchTerm:string='';

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
      console.log(data);

      this.filterSearch1(data);
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
    this.http.get(`${environment.Url}/get-cart`).subscribe(
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
  }

  onView() {
    this.showCart = false;
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
    this.main
      .filterProduct(this.filterData, this.limit, this.pageNo)
      .subscribe({
        next: (res: any) => {
          console.log(res.data);
          this.productData = res.data;
          this.totalPage = res.paggination.totalPage;
          this.totalcount = res.paggination.totalCount;
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

  searchCategory() {
    this.fetchData();
    this.updateQuery();
  }

  filterSearch(event: any) {
    // console.log(event);
    // this.filterData.product_name = event.target.value;
    // console.log(this.filterData);
    // this.fetchData();
    // this.updateQuery();
    this.subject.next(event);

    //this.fetchData();
  }
  filterSearch1(event: any) {
    console.log(event);
    this.filterData.product_name = event.target.value;
    console.log(this.filterData);
    this.fetchData();
    this.updateQuery();
  }

  resetFilter() {
    this.filterData.category_name = '';
    this.searchCategory();
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
            console.log('Product soft deleted successfully');
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
          console.log('Data uploaded successfully:', response);
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
          console.log('New product added:', data);
        },
        (error) => {
          console.error('Error adding product:', error);
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
      // alert('Product updated successfully');
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
      // alert('No file selected.');
      this.toastr.error('No File Selected', 'Error');
      return;
    }
    const fileType = file.name.split('.').pop();
    if (fileType !== 'xlsx' && fileType !== 'xls') {
      // alert('Invalid file type. Please upload an Excel file.');
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
      console.log('Uploading data...');
      for (let items of this.data) {
        this.main.addproducts(items);
      }
      // alert('Data successfully updated');
      this.toastr.success('Data Successfully Updated', 'Success');
    }
  }
  increaseCart(item: any) {}
  decreaseCart(item: any) {
    console.log(item);

    const payload = {
      product_name: item.product_name,
    };
    console.log(payload);
    this.http
      .post('http://localhost:3000/dashboard/cartData/decrease', payload)
      .subscribe({
        next: (response: any) => {
          console.log('Quantity decreased successfully:', response);
        },
        error: (err) => {
          console.error('Error decreasing quantity:', err);
          // alert('Failed to decrease quantity');
          this.toastr.error('Error Decreasing Quantity', 'Error');
        },
      });
  }
}
