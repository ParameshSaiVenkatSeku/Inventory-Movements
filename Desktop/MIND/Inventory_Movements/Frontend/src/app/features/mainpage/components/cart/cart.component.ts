import { Component, OnInit } from '@angular/core';
import { MainpageService } from '../../services/mainpage.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthserviceService } from 'src/app/features/auth/services/authservice.service';

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

  constructor(
    private main: MainpageService,
    private http: HttpClient,
    private authService: AuthserviceService
  ) {}

  ngOnInit(): void {
    this.main.sendToCart.subscribe((data) => {
      this.cartData = data;

      this.cartData.forEach((item) => {
        // Ensure quantity is valid
        if (isNaN(item.quantity) || item.quantity <= 0) {
          item.quantity = 1;
        }

        // Split vendor names into an array
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

  removeItem(id: string): void {
    this.cartData = this.cartData.filter((item) => item.id !== id);
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
    // selectedProducts = this.cartData.find((item) => item.checked);
    console.log(this.cartData);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    for (let selectedProduct of this.cartData) {
      if (selectedProduct) {
        const payload = {
          productId: selectedProduct.product_id,
          quantity: selectedProduct.quantity,
          vendorName: selectedProduct.vendorId,
          userId: user.id,
        };

        await this.http
          .post(`${environment.Url}/move-to-cart`, payload)
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
