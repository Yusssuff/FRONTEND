import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ProductService } from './product.servie';
import { Product } from './products.model';
import { AuthService } from '../auth/auth.serv';

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

  // ==========================================
  // PRODUCTS
  // ==========================================

  products: Product[] = [];

  searchTerm: string = '';

  // ==========================================
  // UI STATE
  // ==========================================

  loading: boolean = false;

  errorMessage: string = '';

  successMessage: string = '';

  // ==========================================
  // ROLE
  // ==========================================

  isAdmin: boolean = false;

  isUser: boolean = false;

  currentRole: string | null = null;

  // ==========================================
  // MODAL
  // ==========================================

  showProductModal: boolean = false;

  isEditMode: boolean = false;

  // ==========================================
  // PRODUCT FORM
  // ==========================================

  productForm = {
    id: 0,
    name: '',
    price: 0
  };

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    // Get the current role from JWT.
    this.currentRole =
      this.authService.getRole();

    this.isAdmin =
      this.authService.isAdmin();

    this.isUser =
      this.authService.isUser();

    // ========================================
    // IMPORTANT:
    // Load products immediately.
    // ========================================

    this.loadProducts();

  }

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  loadProducts(): void {

    this.loading = true;

    this.errorMessage = '';

    this.productService
      .getProducts(this.searchTerm)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (data: Product[]) => {

          console.log('Products loaded:', data.length);

          this.products = data;

          this.loading = false;

        },

        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'Failed to load products.',
            error
          );

          this.products = [];

          this.loading = false;

          // -------------------------------
          // Unauthorized
          // -------------------------------

          if (error.status === 401) {

            this.errorMessage =
              'Your session has expired. Please login again.';

            this.authService.logout();

            this.router.navigate(['/']);

            return;
          }

          // -------------------------------
          // Forbidden
          // -------------------------------

          if (error.status === 403) {

            this.errorMessage =
              'You are not authorized to access the products.';

            return;
          }

          // -------------------------------
          // Other errors
          // -------------------------------

          this.errorMessage =
            'Unable to load products. Please make sure the backend server is running.';

        }

      });

  }

  // ==========================================
  // SEARCH
  // ==========================================

  searchProducts(): void {

    this.loadProducts();

  }

  // ==========================================
  // CLEAR SEARCH
  // ==========================================

  clearSearch(): void {

    this.searchTerm = '';

    this.loadProducts();

  }

  // ==========================================
  // REFRESH
  // ==========================================

  refreshProducts(): void {

    this.loadProducts();

  }

  // ==========================================
  // FILTERED PRODUCTS
  // ==========================================

  get filteredProducts(): Product[] {

    if (!this.searchTerm.trim()) {

      return this.products;

    }

    const search =
      this.searchTerm
        .toLowerCase()
        .trim();

    return this.products.filter(
      product =>
        product.name
          .toLowerCase()
          .includes(search)
    );

  }

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  openCreateModal(): void {

    // User cannot create products.
    if (!this.isAdmin) {

      return;

    }

    this.isEditMode = false;

    this.productForm = {

      id: 0,

      name: '',

      price: 0

    };

    this.errorMessage = '';

    this.successMessage = '';

    this.showProductModal = true;

  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  openEditModal(product: Product): void {

    // User cannot edit products.
    if (!this.isAdmin) {

      return;

    }

    this.isEditMode = true;

    this.productForm = {

      id: product.id,

      name: product.name,

      price: product.price

    };

    this.errorMessage = '';

    this.successMessage = '';

    this.showProductModal = true;

  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  closeProductModal(): void {

    this.showProductModal = false;

    this.errorMessage = '';

  }

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  saveProduct(): void {

    // Only Admin.
    if (!this.isAdmin) {

      return;

    }

    this.errorMessage = '';

    this.successMessage = '';

    const name =
      this.productForm.name.trim();

    const price =
      Number(this.productForm.price);

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!name) {

      this.errorMessage =
        'Product name is required.';

      return;

    }

    if (!Number.isFinite(price) || price <= 0) {

      this.errorMessage =
        'Product price must be greater than 0.';

      return;

    }

    this.loading = true;

    // ========================================
    // CREATE
    // ========================================

    if (!this.isEditMode) {

      this.productService
        .createProduct({

          name: name,

          price: price

        })
        .subscribe({

          next: () => {

            this.loading = false;

            this.showProductModal = false;

            this.successMessage =
              'Product created successfully.';

            this.loadProducts();

          },

          error: (error) => {

            this.loading = false;

            this.handleProductError(error);

          }

        });

      return;

    }

    // ========================================
    // UPDATE
    // ========================================

    this.productService
      .updateProduct({

        id: this.productForm.id,

        name: name,

        price: price

      })
      .subscribe({

        next: () => {

          this.loading = false;

          this.showProductModal = false;

          this.successMessage =
            'Product updated successfully.';

          this.loadProducts();

        },

        error: (error) => {

          this.loading = false;

          this.handleProductError(error);

        }

      });

  }

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  deleteProduct(product: Product): void {

    // ========================================
    // IMPORTANT:
    // Normal users cannot delete.
    // ========================================

    if (!this.isAdmin) {

      return;

    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      );

    if (!confirmed) {

      return;

    }

    this.loading = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.productService
      .deleteProduct(product.id)
      .subscribe({

        next: () => {

          this.loading = false;

          this.successMessage =
            'Product deleted successfully.';

          this.loadProducts();

        },

        error: (error) => {

          this.loading = false;

          this.handleProductError(error);

        }

      });

  }

  // ==========================================
  // HANDLE PRODUCT ERROR
  // ==========================================

  private handleProductError(error: any): void {

    if (error.status === 401) {

      this.authService.logout();

      this.router.navigate(['/']);

      return;

    }

    if (error.status === 403) {

      this.errorMessage =
        'You do not have permission to perform this action.';

      return;

    }

    this.errorMessage =
      'Something went wrong. Please try again.';

  }

  // ==========================================
  // LOGOUT
  // ==========================================

  logout(): void {

    this.authService.logout();

    this.router.navigate(['/']);

  }

}
