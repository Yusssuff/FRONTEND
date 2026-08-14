import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from './products.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = 'http://localhost:5113/odata/Products';

  constructor(private http: HttpClient) {}

  // =========================
  // GET ALL PRODUCTS
  // =========================
  getProducts(
    search?: string,
    sort?: string
  ): Observable<Product[]> {

    let params = new HttpParams();

    // OData filtering
    if (search && search.trim()) {
      params = params.set(
        '$filter',
        `contains(Name,'${search.trim()}')`
      );
    }

    // OData ordering
    if (sort) {
      params = params.set('$orderby', sort);
    }

    return this.http.get<Product[]>(
      this.apiUrl,
      { params }
    );
  }


  // =========================
  // GET PRODUCT BY ID
  // =========================
  getProduct(id: number): Observable<Product> {

    return this.http.get<Product>(
      `${this.apiUrl}(${id})`
    );
  }


  // =========================
  // CREATE PRODUCT
  // =========================
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {

    return this.http.post<Product>(
      this.apiUrl,
      product
    );
  }


  // =========================
  // UPDATE PRODUCT
  // =========================
  updateProduct(product: Product): Observable<Product> {

    return this.http.put<Product>(
      `${this.apiUrl}(${product.id})`,
      product
    );
  }


  // =========================
  // DELETE PRODUCT
  // =========================
  deleteProduct(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}(${id})`
    );
  }
}
