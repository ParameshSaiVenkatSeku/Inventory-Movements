import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: false,
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchTerm: any): any[] {
    if (!items || !searchTerm) {
      return items;
    }
    searchTerm = searchTerm.toLowerCase();

    return items.filter((item) =>
      item.product_name?.toLowerCase().includes(searchTerm)
    );
  }
}
