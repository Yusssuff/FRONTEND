import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from './product.servie';
import { Product } from './products.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './products.html'
})
export class Products implements OnInit {

  products: Product[] = [];

  searchTerm: string = '';

  loading: boolean = false;

  errorMessage: string = '';

  constructor(
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {

    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({

      next: (data: Product[]) => {

        this.products = data;

        this.loading = false;
      },

      error: (error) => {

        this.loading = false;

        this.errorMessage =
          'Unable to load products. Please make sure the backend server is running.';
      }

    });
  }

  get filteredProducts(): Product[] {

    if (!this.searchTerm.trim()) {
      return this.products;
    }

    const search = this.searchTerm
      .toLowerCase()
      .trim();

    return this.products.filter(product =>
      product.name.toLowerCase().includes(search)
    );
  }
} 
