import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { MainpageService } from '../../services/mainpage.service';
import { ToastrService } from 'ngx-toastr';
import { AwsService } from '../../services/aws.service';
@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent implements OnInit {
  selectedVendors: number[] = [];
  productForm: FormGroup;
  selectedFile: File | null = null;
  item: any;
  uploadedImageUrl: string = '';
  @Output() formSubmitted = new EventEmitter<any>();
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private main: MainpageService,
    private toastr: ToastrService,
    private aws: AwsService
  ) {
    this.main.dataSource.subscribe((data) => {
      this.item = data;
      if (this.item) {
        this.populateFormForEdit();
      }
    });
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendor: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: ['', Validators.required],
      status: ['', Validators.required],
      productImage: [''],
    });
  }
  vendors: any;
  categories: any;
  ngOnInit(): void {
    this.http
      .get(`${environment.Url}/dashboard/vendor`)
      .subscribe((data: any) => {
        this.vendors = data;
        if (this.item) {
          this.populateFormForEdit();
        }
      });

    this.http
      .get(`${environment.Url}/dashboard/categories`)
      .subscribe((data: any) => {
        this.categories = data;
        if (this.item && this.vendors) {
          this.populateFormForEdit();
        }
      });
  }

  onVendorChange(event: any) {
    const vendorId = event.target.value;
    if (event.target.checked) {
      this.selectedVendors.push(vendorId);
    } else {
      this.selectedVendors = this.selectedVendors.filter(
        (id) => id !== vendorId
      );
    }
    this.productForm.get('vendor')?.setValue(this.selectedVendors);
  }

  isSelected(vendorId: number): boolean {
    return this.selectedVendors.includes(vendorId);
  }

  onSubmit() {
    if (this.productForm.valid) {
      const productData = {
        ...this.productForm.value,
        vendor: this.selectedVendors,
        productImage: this.uploadedImageUrl,
      };
      if (this.item) {
        productData.productId = this.item.product_id;
      }
      this.formSubmitted.emit(productData);
    }
  }

  onUpload() {
    if (this.selectedFile) {
      const fileName = this.selectedFile.name;
      const fileType = this.selectedFile.type;
      this.aws.getPresignedUrl(fileName, fileType, '3').subscribe({
        next: (response: any) => {
          const { presignedUrl, fileName, userId } = response;
          this.uploadedImageUrl = response.imageUrl;
          try {
            this.uploadToS3(presignedUrl, fileName, userId, response.imageUrl);
          } catch (error) {}
        },
        error: (error: any) => {
          console.error('Error getting presigned URL:', error);
        },
      });
    }
  }

  uploadToS3(
    presignedUrl: string,
    fileName: string,
    userId: string,
    image: string
  ): void {
    if (this.selectedFile) {
      this.aws.uploadFileToS3(presignedUrl, this.selectedFile).subscribe({
        next: () => {
          this.http
            .put(`${environment.Url}/dashboard/product/updateImage`, {
              id: this.item?.product_id,
              image: image,
            })
            .subscribe({
              next: (data) => {
                this.toastr.success(
                  'Picture successfully uploaded to S3',
                  'Success'
                );
              },
              error: (error) => {
                console.error('Error updating image:', error);
              },
            });
        },
        error: (error) => {
          console.error('Error uploading file:', error);
        },
      });
    }
  }

  populateFormForEdit() {
    if (!this.vendors || !this.categories) {
      console.warn('Vendors or categories data is not yet loaded.');
      return;
    }
    this.productForm.patchValue({
      productName: this.item.product_name,
      quantity: this.item.quantity_in_stock,
      unit: this.item.unit_price,
      status: this.item.status,
    });

    if (this.item.category_name) {
      const category = this.categories?.data?.find(
        (c: any) => c.category_name === this.item.category_name
      );
      if (category) {
        this.productForm.get('category')?.setValue(category.category_id);
      }
    }

    if (this.item.vendor_name) {
      const vendorNames = this.item.vendor_name
        .split(',')
        .map((name: string) => name.trim());
      const selectedVendors = this.vendors?.data?.filter((v: any) =>
        vendorNames.includes(v.vendor_name)
      );

      if (selectedVendors && selectedVendors.length > 0) {
        const vendorIds = selectedVendors.map(
          (vendor: any) => vendor.vendor_id
        );
        this.selectedVendors = vendorIds;
        this.productForm.get('vendor')?.setValue(this.selectedVendors);
      }
    }

    if (this.item.product_image) {
      const imagePreviewElement = document.getElementById(
        'imagePreview'
      ) as HTMLImageElement;
      if (imagePreviewElement) {
        imagePreviewElement.src = this.item.product_image;
      }
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }
}
