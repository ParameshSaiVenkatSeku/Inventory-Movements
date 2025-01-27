import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MainpageRoutingModule } from './mainpage-routing.module';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from './pipes/filter.pipe';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorInterceptor } from '../auth/interceptors/http-interceptor.interceptor';
import { CartComponent } from './components/cart/cart.component';

@NgModule({
  declarations: [
    DashboardComponent,
    NavbarComponent,
    FileUploadComponent,
    InventoryComponent,
    ProductFormComponent,
    FilterPipe,
    CartComponent,
  ],
  imports: [
    CommonModule,
    MainpageRoutingModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [],
})
export class MainpageModule {}
