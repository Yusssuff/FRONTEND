import { Component, OnInit } from '@angular/core';
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
export class Products implements OnInit {

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
    private router: Router
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.updateRole();

    // Automatically load ALL products
    // when the Products page opens.
    this.loadProducts();
  }

  // =========================================================
  // ROLE
  // =========================================================

  private updateRole(): void {

    const role = this.authService.getRole();

    this.currentRole = role || 'User';

    this.isAdmin = this.authService.isAdmin();

    this.isUser = this.authService.isUser();
  }

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  loadProducts(): void {

    this.loading = true;

    this.errorMessage = '';

    this.productService
      .getProducts()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (data: Product[]) => {

          this.products = Array.isArray(data)
            ? [...data]
            : [];

        },

        error: (error) => {

          this.products = [];

          // -----------------------------------------
          // UNAUTHORIZED
          // -----------------------------------------

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please login again.';

            this.authService.logout();

            this.router.navigate(['/'], {
              replaceUrl: true,
            });

            return;
          }

          // -----------------------------------------
          // FORBIDDEN
          // -----------------------------------------

          if (error?.status === 403) {

            this.errorMessage =
              'You are not authorized to access the products.';

            return;
          }

          // -----------------------------------------
          // OTHER ERROR
          // -----------------------------------------

          this.errorMessage =
            'Unable to load products. Please make sure the backend server is running.';
        },
      });
  }

  // =========================================================
  // SEARCH
  // =========================================================

  searchProducts(): void {

    // Search is done locally.
    //
    // We DON'T call the backend here.
    // filteredProducts automatically updates
    // when searchTerm changes.
  }

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  clearSearch(): void {

    this.searchTerm = '';

  }

  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  get filteredProducts(): Product[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    // -----------------------------------------
    // NO SEARCH
    // -----------------------------------------

    if (!search) {

      return this.products;

    }

    // -----------------------------------------
    // SEARCH
    // -----------------------------------------

    return this.products.filter(
      (product: Product) =>
        product.name
          .toLowerCase()
          .includes(search)
    );
  }

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  openCreateModal(): void {

    // Normal User cannot create.
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
  }

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  openEditModal(product: Product): void {

    // Normal User cannot edit.
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
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  closeProductModal(): void {

    // Don't close while saving.
    if (this.savingProduct) {
      return;
    }

    this.showProductModal = false;

    this.errorMessage = '';
  }

  // =========================================================
  // SAVE PRODUCT
  // =========================================================

  saveProduct(): void {

    // Only Admin can create/update.
    if (!this.isAdmin) {
      return;
    }

    this.errorMessage = '';

    this.successMessage = '';

    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const name =
      this.productForm.name.trim();

    const price =
      Number(this.productForm.price);

    // -----------------------------------------
    // VALIDATE NAME
    // -----------------------------------------

    if (!name) {

      this.errorMessage =
        'Product name is required.';

      return;
    }

    // -----------------------------------------
    // VALIDATE PRICE
    // -----------------------------------------

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {

      this.errorMessage =
        'Please enter a valid price.';

      return;
    }

    this.savingProduct = true;

    // =========================================================
    // UPDATE PRODUCT
    // =========================================================

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
          })
        )
        .subscribe({

          next: () => {

            this.showProductModal = false;

            this.successMessage =
              'Product updated successfully.';

            // Reload products after update.
            this.loadProducts();
          },

          error: (error) => {

            this.handleProductError(error);

          },
        });

      return;
    }

    // =========================================================
    // CREATE PRODUCT
    // =========================================================

    const newProduct: Omit<Product, 'id'> = {

      name: name,

      price: price,
    };

    this.productService
      .createProduct(newProduct)
      .pipe(
        finalize(() => {
          this.savingProduct = false;
        })
      )
      .subscribe({

        next: () => {

          this.showProductModal = false;

          this.successMessage =
            'Product created successfully.';

          // Reload products after creation.
          this.loadProducts();
        },

        error: (error) => {

          this.handleProductError(error);

        },
      });
  }

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  deleteProduct(product: Product): void {

    // =======================================================
    // IMPORTANT
    // =======================================================
    //
    // Normal User can NEVER delete from the UI.
    //
    // Backend authorization must ALSO protect DELETE.
    // =======================================================

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

    this.deletingProductId =
      product.id;

    this.errorMessage = '';

    this.successMessage = '';

    this.productService
      .deleteProduct(product.id)
      .pipe(
        finalize(() => {

          this.deletingProductId = null;

        })
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Product deleted successfully.';

          // Reload products after deletion.
          this.loadProducts();
        },

        error: (error) => {

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

      this.errorMessage =
        'You do not have permission to perform this action.';

      return;
    }

    // -----------------------------------------
    // OTHER ERROR
    // -----------------------------------------

    this.errorMessage =
      'Something went wrong. Please try again.';
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
