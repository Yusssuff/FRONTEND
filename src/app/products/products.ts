import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from './product.servie';
import { Product } from './products.model';
import { AuthService } from '../auth/auth.serv';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  // =========================================================
  // PRODUCTS
  // =========================================================

  products: Product[] = [];

  searchTerm = '';

  loading = false;

  errorMessage = '';

  // =========================================================
  // PRODUCT MODAL
  // =========================================================

  showProductModal = false;

  editingProduct = false;

  savingProduct = false;

  deletingProductId: number | null = null;

  // =========================================================
  // PRODUCT FORM
  // =========================================================

  productForm: Product = {
    id: 0,
    name: '',
    price: 0,
  };

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadProducts();
    }, 0);
  }

  // LOAD PRODUCTS

  loadProducts(): void {
    this.loading = true;

    this.errorMessage = '';

    this.productService
      .getProducts(this.searchTerm)

      .pipe(
        finalize(() => {
          this.loading = false;

          this.cdr.detectChanges();
        }),
      )

      .subscribe({
        next: (products: Product[]) => {
          this.products = [...products];

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Failed to load products:', error);

          this.products = [];

          if (error.status === 401) {
            this.errorMessage = 'Your session has expired. Please login again.';

            this.authService.logout();

            this.router.navigate(['/'], {
              replaceUrl: true,
            });

            return;
          }

          if (error.status === 403) {
            this.errorMessage = 'You are not authorized to access the products.';

            return;
          }

          this.errorMessage =
            'Unable to load products. Please make sure the backend server is running.';
        },
      });
  }

  // SEARCH

  searchProducts(): void {
    this.loadProducts();
  }

  // CLEAR SEARCH

  clearSearch(): void {
    this.searchTerm = '';

    this.loadProducts();
  }

  // OPEN CREATE MODAL

  openCreateModal(): void {
    this.editingProduct = false;

    this.productForm = {
      id: 0,
      name: '',
      price: 0,
    };

    this.errorMessage = '';

    this.showProductModal = true;

    this.cdr.detectChanges();
  }

  // OPEN EDIT MODAL

  openEditModal(product: Product): void {
    this.editingProduct = true;

    this.productForm = {
      id: product.id,
      name: product.name,
      price: product.price,
    };

    this.errorMessage = '';

    this.showProductModal = true;

    this.cdr.detectChanges();
  }

  // CLOSE MODAL

  closeProductModal(): void {
    if (this.savingProduct) {
      return;
    }

    this.showProductModal = false;

    this.errorMessage = '';
  }

  // SAVE PRODUCT

  saveProduct(): void {
    this.errorMessage = '';

    const name = this.productForm.name.trim();

    const price = Number(this.productForm.price);

    if (!name) {
      this.errorMessage = 'Product name is required.';

      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage = 'Please enter a valid price.';

      return;
    }

    this.savingProduct = true;

    // UPDATE

    if (this.editingProduct) {
      const productToUpdate: Product = {
        id: this.productForm.id,
        name: name,
        price: price,
      };

      this.productService
        .updateProduct(productToUpdate)

        .subscribe({
          next: () => {
            this.savingProduct = false;

            this.showProductModal = false;

            this.loadProducts();
          },

          error: () => {
            this.savingProduct = false;

            this.errorMessage = 'Unable to update the product.';

            this.cdr.detectChanges();
          },
        });

      return;
    }

    // CREATE

    const newProduct: Omit<Product, 'id'> = {
      name: name,

      price: price,
    };

    this.productService
      .createProduct(newProduct)

      .subscribe({
        next: () => {
          this.savingProduct = false;

          this.showProductModal = false;

          this.loadProducts();
        },

        error: () => {
          this.savingProduct = false;

          this.errorMessage = 'Unable to create the product.';

          this.cdr.detectChanges();
        },
      });
  }

  // DELETE PRODUCT

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingProductId = product.id;

    this.productService
      .deleteProduct(product.id)

      .subscribe({
        next: () => {
          this.deletingProductId = null;

          this.loadProducts();
        },

        error: () => {
          this.deletingProductId = null;

          this.errorMessage = 'Unable to delete the product.';

          this.cdr.detectChanges();
        },
      });
  }

  // LOGOUT

  logout(): void {
    this.authService.logout();

    this.router.navigate(['/'], {
      replaceUrl: true,
    });
  }

  // FILTER

  get filteredProducts(): Product[] {
    if (!this.searchTerm.trim()) {
      return this.products;
    }

    const search = this.searchTerm.toLowerCase().trim();

    return this.products.filter((product) => product.name.toLowerCase().includes(search));
  }
}
