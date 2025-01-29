import { Component, OnInit } from '@angular/core';
import { MainpageService } from '../../services/mainpage.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Toast, ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  cartData: any[] = [];
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  alertMessage: string = '';
  showAlert: boolean = false;
  userId: number = 0;

  constructor(
    private main: MainpageService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.main.sendToCart.subscribe((data) => {
      this.cartData = data;

      this.cartData.forEach((item) => {
        if (isNaN(item.quantity) || item.quantity <= 0) {
          item.quantity = 1;
        }

        item.vendorNames = item.vendor_name
          .split(',')
          .map((vendor: string) => vendor.trim());
      });

      this.totalCount = data.length;
      this.totalPages = Math.ceil(this.totalCount / 10);
      console.log('Cart data:', this.cartData);
    });
  }

  incrementQuantity(item: any): void {
    if (item.quantity < item.quantity_in_stock) {
      item.quantity++;
    }
  }

  decrementQuantity(item: any): void {
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  removeItem(productId: string): void {
    this.cartData = this.cartData.filter(
      (item) => item.product_id !== productId
    );

    this.totalCount = this.cartData.length;
    this.totalPages = Math.ceil(this.totalCount / 10);
    this.toastr.success('Item removed successfully!', 'Success');
  }

  getPageNumbers(): number[] {
    const pageNumbers = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  async moveToCart() {
    console.log(this.cartData);
    const token = sessionStorage.getItem('access_token');
    if (token) {
      this.userId = JSON.parse(atob(token.split('.')[1]));
      console.log(this.userId, token);
    } else {
      console.error('No access token found');
      return;
    }
    for (let selectedProduct of this.cartData) {
      if (selectedProduct) {
        const payload = {
          productId: selectedProduct.product_id,
          quantity: selectedProduct.quantity,
          vendorName: selectedProduct.vendorId,
          userId: this.userId,
        };

        await this.http
          .post(`${environment.Url}/dashboard/move-to-cart`, payload)
          .subscribe(
            (response: any) => {
              console.log('Product moved to cart:', response);

              this.alertMessage = 'Item added to cart';
              this.showAlert = true;
              setTimeout(() => {
                this.showAlert = false;
              }, 3000);
            },
            (error: any) => {
              console.error('Error moving product to cart:', error);
            }
          );
      } else {
        console.error('No product selected');
      }
    }
  }
}
