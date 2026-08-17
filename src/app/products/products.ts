import { Component, ChangeDetectorRef, afterNextRender } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductService } from './product.servie';
import { Product } from './products.model';
import { AuthService } from '../auth/auth.serv';

@Component({
  selector: 'app-products',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './products.html',
})
export class Products {
  // =========================================================
  // PRODUCTS
  // =========================================================

  products: Product[] = [];

  searchTerm: string = '';

  // =========================================================
  // UI STATE
  // =========================================================

  loading: boolean = false;

  errorMessage: string = '';

  successMessage: string = '';

  // =========================================================
  // ROLE
  // =========================================================

  currentRole: string = 'User';

  isAdmin: boolean = false;

  isUser: boolean = false;

  // =========================================================
  // MODAL
  // =========================================================

  showProductModal: boolean = false;

  editingProduct: boolean = false;

  savingProduct: boolean = false;

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
  ) {
    /*
     * IMPORTANT
     *
     * Because this application uses Angular SSR,
     * we wait until Angular has rendered the page
     * in the browser before requesting products.
     *
     * afterNextRender MUST be registered from an
     * injection context such as the constructor.
     */

    afterNextRender(() => {
      this.initializeProductsPage();
    });
  }

  // =========================================================
  // INITIALIZE PRODUCTS PAGE
  // =========================================================

  private initializeProductsPage(): void {
    // -----------------------------------------
    // GET CURRENT ROLE
    // -----------------------------------------

    this.currentRole = this.authService.getRole() || 'User';

    this.isAdmin = this.authService.isAdmin();

    this.isUser = this.authService.isUser();

    // -----------------------------------------
    // LOAD ALL PRODUCTS
    // -----------------------------------------

    this.loadProducts();
  }

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  loadProducts(): void {
    this.loading = true;

    this.errorMessage = '';

    this.successMessage = '';

    /*
     * Tell Angular that loading started.
     */

    this.cdr.detectChanges();

    /*
     * IMPORTANT:
     *
     * Do NOT pass searchTerm here.
     *
     * This request retrieves ALL products.
     *
     * Searching is handled locally by
     * filteredProducts.
     */

    this.productService
      .getProducts()
      .pipe(
        finalize(() => {
          this.loading = false;

          /*
           * Force Angular to update the UI.
           */

          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        // =====================================================
        // SUCCESS
        // =====================================================

        next: (data: Product[]) => {
          /*
           * Make sure we actually received an array.
           */

          if (Array.isArray(data)) {
            this.products = [...data];
          } else {
            this.products = [];
          }

          /*
           * IMPORTANT:
           *
           * Update Angular immediately.
           *
           * This prevents the situation where:
           *
           * API -> products = 3
           *
           * but the HTML remains on the skeleton.
           */

          this.cdr.detectChanges();
        },

        // =====================================================
        // ERROR
        // =====================================================

        error: (error: any) => {
          this.products = [];

          // -----------------------------------------------
          // 401 - UNAUTHORIZED
          // -----------------------------------------------

          if (error?.status === 401) {
            this.errorMessage = 'Your session has expired. Please login again.';

            this.authService.logout();

            this.router.navigate(['/'], {
              replaceUrl: true,
            });

            this.cdr.detectChanges();

            return;
          }

          // -----------------------------------------------
          // 403 - FORBIDDEN
          // -----------------------------------------------

          if (error?.status === 403) {
            this.errorMessage = 'You are not authorized to access the products.';

            this.cdr.detectChanges();

            return;
          }

          // -----------------------------------------------
          // OTHER ERROR
          // -----------------------------------------------

          this.errorMessage =
            'Unable to load products. Please make sure the backend server is running.';

          this.cdr.detectChanges();
        },
      });
  }

  // =========================================================
  // SEARCH
  // =========================================================

  searchProducts(): void {
    /*
     * We already have ALL products in memory.
     *
     * So we don't need another HTTP request
     * every time the user types.
     *
     * filteredProducts automatically filters
     * the products.
     */

    this.cdr.detectChanges();
  }

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  clearSearch(): void {
    this.searchTerm = '';

    this.cdr.detectChanges();
  }

  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  get filteredProducts(): Product[] {
    const search = this.searchTerm.trim().toLowerCase();

    // -----------------------------------------
    // NO SEARCH
    // -----------------------------------------

    if (!search) {
      return this.products;
    }

    // -----------------------------------------
    // FILTER
    // -----------------------------------------

    return this.products.filter((product: Product) => product.name.toLowerCase().includes(search));
  }

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  openCreateModal(): void {
    /*
     * Only Admin can create.
     */

    if (!this.isAdmin) {
      return;
    }

    this.editingProduct = false;

    this.productForm = {
      id: 0,

      name: '',

      price: 0,
    };

    this.errorMessage = '';

    this.successMessage = '';

    this.showProductModal = true;

    this.cdr.detectChanges();
  }

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  openEditModal(product: Product): void {
    /*
     * Only Admin can edit.
     */

    if (!this.isAdmin) {
      return;
    }

    this.editingProduct = true;

    this.productForm = {
      id: product.id,

      name: product.name,

      price: product.price,
    };

    this.errorMessage = '';

    this.successMessage = '';

    this.showProductModal = true;

    this.cdr.detectChanges();
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  closeProductModal(): void {
    if (this.savingProduct) {
      return;
    }

    this.showProductModal = false;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // =========================================================
  // SAVE PRODUCT
  // =========================================================

  saveProduct(): void {
    /*
     * Only Admin can create/update.
     */

    if (!this.isAdmin) {
      return;
    }

    this.errorMessage = '';

    this.successMessage = '';

    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const name = this.productForm.name.trim();

    const price = Number(this.productForm.price);

    // -----------------------------------------
    // VALIDATE NAME
    // -----------------------------------------

    if (!name) {
      this.errorMessage = 'Product name is required.';

      return;
    }

    // -----------------------------------------
    // VALIDATE PRICE
    // -----------------------------------------

    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage = 'Please enter a valid price.';

      return;
    }

    this.savingProduct = true;

    // =====================================================
    // UPDATE
    // =====================================================

    if (this.editingProduct) {
      const productToUpdate: Product = {
        id: this.productForm.id,

        name: name,

        price: price,
      };

      this.productService

        .updateProduct(productToUpdate)

        .pipe(
          finalize(() => {
            this.savingProduct = false;

            this.cdr.detectChanges();
          }),
        )

        .subscribe({
          next: () => {
            this.showProductModal = false;

            this.successMessage = 'Product updated successfully.';

            /*
             * Reload all products.
             */

            this.loadProducts();
          },

          error: (error: any) => {
            this.handleProductError(error);
          },
        });

      return;
    }

    // =====================================================
    // CREATE
    // =====================================================

    const newProduct = {
      name: name,

      price: price,
    };

    this.productService

      .createProduct(newProduct)

      .pipe(
        finalize(() => {
          this.savingProduct = false;

          this.cdr.detectChanges();
        }),
      )

      .subscribe({
        next: () => {
          this.showProductModal = false;

          this.successMessage = 'Product created successfully.';

          /*
           * Reload all products.
           */

          this.loadProducts();
        },

        error: (error: any) => {
          this.handleProductError(error);
        },
      });
  }

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  deleteProduct(product: Product): void {
    /*
     * IMPORTANT:
     *
     * Normal User cannot delete.
     */

    if (!this.isAdmin) {
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingProductId = product.id;

    this.errorMessage = '';

    this.successMessage = '';

    this.productService

      .deleteProduct(product.id)

      .pipe(
        finalize(() => {
          this.deletingProductId = null;

          this.cdr.detectChanges();
        }),
      )

      .subscribe({
        next: () => {
          this.successMessage = 'Product deleted successfully.';

          /*
           * Reload products after deletion.
           */

          this.loadProducts();
        },

        error: (error: any) => {
          this.handleProductError(error);
        },
      });
  }

  // =========================================================
  // HANDLE PRODUCT ERROR
  // =========================================================

  private handleProductError(error: any): void {
    // -----------------------------------------
    // 401
    // -----------------------------------------

    if (error?.status === 401) {
      this.authService.logout();

      this.router.navigate(['/'], {
        replaceUrl: true,
      });

      return;
    }

    // -----------------------------------------
    // 403
    // -----------------------------------------

    if (error?.status === 403) {
      this.errorMessage = 'You do not have permission to perform this action.';

      this.cdr.detectChanges();

      return;
    }

    // -----------------------------------------
    // OTHER
    // -----------------------------------------

    this.errorMessage = 'Something went wrong. Please try again.';

    this.cdr.detectChanges();
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {
    this.authService.logout();

    this.router.navigate(['/'], {
      replaceUrl: true,
    });
  }
}
