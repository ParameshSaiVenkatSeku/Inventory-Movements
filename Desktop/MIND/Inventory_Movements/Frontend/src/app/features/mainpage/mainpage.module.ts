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
import { CartComponent } from './components/cart/cart.component';
import { ImportFileComponent } from './components/import-file/import-file.component';

@NgModule({
  declarations: [
    DashboardComponent,
    NavbarComponent,
    FileUploadComponent,
    InventoryComponent,
    ProductFormComponent,
    FilterPipe,
    CartComponent,
    ImportFileComponent,
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
