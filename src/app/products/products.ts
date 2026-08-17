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

  searchTerm = '';

  // =========================================================
  // UI STATE
  // =========================================================

  loading = false;

  errorMessage = '';

  successMessage = '';

  // =========================================================
  // ROLE
  // =========================================================

  currentRole: string = 'User';

  isAdmin = false;

  isUser = false;

  // =========================================================
  // MODAL
  // =========================================================

  showProductModal = false;

  editingProduct = false;

  savingProduct = false;

  deletingProductId: number | null = null;

  // =========================================================
  // FORM
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
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.updateRole();

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
        }),
      )
      .subscribe({
        next: (data: Product[]) => {
          /*
           * IMPORTANT:
           * Put the products into the component first.
           *
           * The HTML will render based on products.length,
           * not only on loading.
           */
          this.products = Array.isArray(data) ? [...data] : [];
        },

        error: (error) => {
          this.products = [];

          if (error?.status === 401) {
            this.errorMessage =
              'Your session has expired. Please login again.';

            this.authService.logout();

            this.router.navigate(['/'], {
              replaceUrl: true,
            });

            return;
          }

          if (error?.status === 403) {
            this.errorMessage =
              'You are not authorized to access the products.';

            return;
          }

          this.errorMessage =
            'Unable to load products. Please make sure the backend server is running.';
        },
      });
  }

  // =========================================================
  // SEARCH
  // =========================================================

  searchProducts(): void {
    /*
     * Search locally.
     *
     * This prevents sending a request for every character
     * typed into the search box.
     */
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
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.products;
    }

    return this.products.filter((product) =>
      product.name.toLowerCase().includes(search),
    );
  }

  // =========================================================
  // OPEN CREATE MODAL
  // =========================================================

  openCreateModal(): void {
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
    if (!this.isAdmin) {
      return;
    }

    this.errorMessage = '';

    this.successMessage = '';

    const name = this.productForm.name.trim();

    const price = Number(this.productForm.price);

    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!name) {
      this.errorMessage = 'Product name is required.';
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage = 'Please enter a valid price.';
      return;
    }

    this.savingProduct = true;

    // =========================================================
    // UPDATE
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
          }),
        )
        .subscribe({
          next: () => {
            this.showProductModal = false;

            this.successMessage =
              'Product updated successfully.';

            this.loadProducts();
          },

          error: (error) => {
            this.handleProductError(error);
          },
        });

      return;
    }

    // =========================================================
    // CREATE
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
        }),
      )
      .subscribe({
        next: () => {
          this.showProductModal = false;

          this.successMessage =
            'Product created successfully.';

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
    /*
     * Frontend protection:
     * Normal users cannot delete.
     */
    if (!this.isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

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
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Product deleted successfully.';

          this.loadProducts();
        },

        error: (error) => {
          this.handleProductError(error);
        },
      });
  }

  // =========================================================
  // HANDLE ERROR
  // =========================================================

  private handleProductError(error: any): void {
    if (error?.status === 401) {
      this.authService.logout();

      this.router.navigate(['/'], {
        replaceUrl: true,
      });

      return;
    }

    if (error?.status === 403) {
      this.errorMessage =
        'You do not have permission to perform this action.';

      return;
    }

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
